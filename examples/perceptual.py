from __future__ import division
import numpy as np
import cv2
from scipy import signal
import itertools
import scipy.misc as sc

def visualize(coeff, normalize = True):
  M, N = coeff[1][0].shape
  Norients = len(coeff[1])
  out = np.zeros((M * 2 - coeff[-1].shape[0], Norients * N))

  currentx = 0
  currenty = 0
  for i in range(1, len(coeff[:-1])):
    for j in range(len(coeff[1])):
      tmp = coeff[i][j].real
      m,n = tmp.shape

      if normalize:
        tmp = 255 * tmp/tmp.max()

      tmp[m - 1, :] = 255
      tmp[:, n - 1] = 2555

      out[currentx : currentx + m, currenty : currenty + n] = tmp
      currenty += n
    currentx += coeff[i][0].shape[0]
    currenty = 0

  m,n = coeff[-1].shape
  out[currentx : currentx+m, currenty : currenty+n] = 255 * coeff[-1]/coeff[-1].max()

  out[0,:] = 255
  out[:, 0] = 255

  return out

class Steerable:
  def __init__(self, height = 5):
    """
    height is the total height, including highpass and lowpass
    """
    self.nbands = 4
    self.height = height
    self.isSample = True

  def buildSCFpyr(self, im):
    assert len(im.shape) == 2, 'Input image must be grayscale'

    M, N = im.shape
    log_rad, angle = self.base(M, N)
    Xrcos, Yrcos = self.rcosFn(1, -0.5)
    Yrcos = np.sqrt(Yrcos)
    YIrcos = np.sqrt(1 - Yrcos*Yrcos)

    lo0mask = self.pointOp(log_rad, YIrcos, Xrcos)
    hi0mask = self.pointOp(log_rad, Yrcos, Xrcos)

    imdft = np.fft.fftshift(np.fft.fft2(im))
    lo0dft = imdft * lo0mask

    coeff = self.buildSCFpyrlevs(lo0dft, log_rad, angle, Xrcos, Yrcos, self.height - 1)

    hi0dft = imdft * hi0mask
    hi0 = np.fft.ifft2(np.fft.ifftshift(hi0dft))

    coeff.insert(0, hi0.real)

    return coeff

  def getlist(self, coeff):
    straight = [bands for scale in coeff[1:-1] for bands in scale]
    straight = [coeff[0]] + straight + [coeff[-1]]
    return straight

  def buildSCFpyrlevs(self, lodft, log_rad, angle, Xrcos, Yrcos, ht):
    if (ht <=1):
      lo0 = np.fft.ifft2(np.fft.ifftshift(lodft))
      coeff = [lo0.real]

    else:
      Xrcos = Xrcos - 1

      # ==================== Orientation bandpass =======================
      himask = self.pointOp(log_rad, Yrcos, Xrcos)

      lutsize = 1024
      Xcosn = np.pi * np.array(range(-(2*lutsize+1),(lutsize+2)))/lutsize
      order = self.nbands - 1
      const = np.power(2, 2*order) * np.square(sc.factorial(order)) / (self.nbands * sc.factorial(2*order))

      alpha = (Xcosn + np.pi) % (2*np.pi) - np.pi
      Ycosn = 2*np.sqrt(const) * np.power(np.cos(Xcosn), order) * (np.abs(alpha) < np.pi/2)

      orients = []

      for b in range(self.nbands):
        anglemask = self.pointOp(angle, Ycosn, Xcosn + np.pi*b/self.nbands)
        banddft = np.power(np.complex(0,-1), self.nbands - 1) * lodft * anglemask * himask
        band = np.fft.ifft2(np.fft.ifftshift(banddft))
        orients.append(band)

      # ================== Subsample lowpass ============================
      dims = np.array(lodft.shape)

      lostart = np.ceil((dims+0.5)/2) - np.ceil((np.ceil((dims-0.5)/2)+0.5)/2)
      loend = lostart + np.ceil((dims-0.5)/2)

      lostart = lostart.astype(int)
      loend = loend.astype(int)

      log_rad = log_rad[lostart[0]:loend[0], lostart[1]:loend[1]]
      angle = angle[lostart[0]:loend[0], lostart[1]:loend[1]]
      lodft = lodft[lostart[0]:loend[0], lostart[1]:loend[1]]
      YIrcos = np.abs(np.sqrt(1 - Yrcos*Yrcos))
      lomask = self.pointOp(log_rad, YIrcos, Xrcos)

      lodft = lomask * lodft

      coeff = self.buildSCFpyrlevs(lodft, log_rad, angle, Xrcos, Yrcos, ht-1)
      coeff.insert(0, orients)

    return coeff

  def reconSCFpyrLevs(self, coeff, log_rad, Xrcos, Yrcos, angle):

    if (len(coeff) == 1):
      return np.fft.fftshift(np.fft.fft2(coeff[0]))

    else:

      Xrcos = Xrcos - 1

        # ========================== Orientation residue==========================
      himask = self.pointOp(log_rad, Yrcos, Xrcos)

      lutsize = 1024
      Xcosn = np.pi * np.array(range(-(2*lutsize+1),(lutsize+2)))/lutsize
      order = self.nbands - 1
      const = np.power(2, 2*order) * np.square(sc.factorial(order)) / (self.nbands * sc.factorial(2*order))
      Ycosn = np.sqrt(const) * np.power(np.cos(Xcosn), order)

      orientdft = np.zeros(coeff[0][0].shape)

      for b in range(self.nbands):
        anglemask = self.pointOp(angle, Ycosn, Xcosn + np.pi* b/self.nbands)
        banddft = np.fft.fftshift(np.fft.fft2(coeff[0][b]))
        orientdft = orientdft + np.power(np.complex(0,1), order) * banddft * anglemask * himask

      # ============== Lowpass component are upsampled and convoluted ============
      dims = np.array(coeff[0][0].shape)

      lostart = (np.ceil((dims+0.5)/2) - np.ceil((np.ceil((dims-0.5)/2)+0.5)/2)).astype(np.int32)
      loend = lostart + np.ceil((dims-0.5)/2).astype(np.int32)
      lostart = lostart.astype(int)
      loend = loend.astype(int)

      nlog_rad = log_rad[lostart[0]:loend[0], lostart[1]:loend[1]]
      nangle = angle[lostart[0]:loend[0], lostart[1]:loend[1]]
      YIrcos = np.sqrt(np.abs(1 - Yrcos * Yrcos))
      lomask = self.pointOp(nlog_rad, YIrcos, Xrcos)

      nresdft = self.reconSCFpyrLevs(coeff[1:], nlog_rad, Xrcos, Yrcos, nangle)

      res = np.fft.fftshift(np.fft.fft2(nresdft))

      resdft = np.zeros(dims, 'complex')
      resdft[lostart[0]:loend[0], lostart[1]:loend[1]] = nresdft * lomask

      return resdft + orientdft

  def reconSCFpyr(self, coeff):

    if (self.nbands != len(coeff[1])):
      raise Exception("Unmatched number of orientations")

    M, N = coeff[0].shape
    log_rad, angle = self.base(M, N)

    Xrcos, Yrcos = self.rcosFn(1, -0.5)
    Yrcos = np.sqrt(Yrcos)
    YIrcos = np.sqrt(np.abs(1 - Yrcos*Yrcos))

    lo0mask = self.pointOp(log_rad, YIrcos, Xrcos)
    hi0mask = self.pointOp(log_rad, Yrcos, Xrcos)

    tempdft = self.reconSCFpyrLevs(coeff[1:], log_rad, Xrcos, Yrcos, angle)

    hidft = np.fft.fftshift(np.fft.fft2(coeff[0]))
    outdft = tempdft * lo0mask + hidft * hi0mask

    return np.fft.ifft2(np.fft.ifftshift(outdft)).real.astype(int)


  def base(self, m, n):

    x = np.linspace(-(m // 2)/(m / 2), (m // 2)/(m / 2) - (1 - m % 2)*2/m , num = m)
    y = np.linspace(-(n // 2)/(n / 2), (n // 2)/(n / 2) - (1 - n % 2)*2/n , num = n)

    xv, yv = np.meshgrid(y, x)

    angle = np.arctan2(yv, xv)

    rad = np.sqrt(xv**2 + yv**2)
    rad[m//2][n//2] = rad[m//2][n//2 - 1]
    log_rad = np.log2(rad)

    return log_rad, angle

  def rcosFn(self, width, position):
    N = 256
    X = np.pi * np.array(range(-N-1, 2))/2/N

    Y = np.cos(X)**2
    Y[0] = Y[1]
    Y[N+2] = Y[N+1]

    X = position + 2*width/np.pi*(X + np.pi/4)
    return X, Y

  def pointOp(self, im, Y, X):
    out = np.interp(im.flatten(), X, Y)
    return np.reshape(out, im.shape)

class SteerableNoSub(Steerable):

  def buildSCFpyrlevs(self, lodft, log_rad, angle, Xrcos, Yrcos, ht):
    if (ht <=1):
      lo0 = np.fft.ifft2(np.fft.ifftshift(lodft))
      coeff = [lo0.real]

    else:
      Xrcos = Xrcos - 1

      # ==================== Orientation bandpass =======================
      himask = self.pointOp(log_rad, Yrcos, Xrcos)

      lutsize = 1024
      Xcosn = np.pi * np.array(range(-(2*lutsize+1),(lutsize+2)))/lutsize
      order = self.nbands - 1
      const = np.power(2, 2*order) * np.square(sc.factorial(order)) / (self.nbands * sc.factorial(2*order))

      alpha = (Xcosn + np.pi) % (2*np.pi) - np.pi
      Ycosn = 2*np.sqrt(const) * np.power(np.cos(Xcosn), order) * (np.abs(alpha) < np.pi/2)

      orients = []

      for b in range(self.nbands):
        anglemask = self.pointOp(angle, Ycosn, Xcosn + np.pi*b/self.nbands)
        banddft = np.power(np.complex(0,-1), self.nbands - 1) * lodft * anglemask * himask
        band = np.fft.ifft2(np.fft.ifftshift(banddft))
        orients.append(band)

      # ================== Subsample lowpass ============================
      lostart = (0, 0)
      loend = lodft.shape

      log_rad = log_rad[lostart[0]:loend[0], lostart[1]:loend[1]]
      angle = angle[lostart[0]:loend[0], lostart[1]:loend[1]]
      lodft = lodft[lostart[0]:loend[0], lostart[1]:loend[1]]
      YIrcos = np.abs(np.sqrt(1 - Yrcos*Yrcos))
      lomask = self.pointOp(log_rad, YIrcos, Xrcos)

      lodft = lomask * lodft

      coeff = self.buildSCFpyrlevs(lodft, log_rad, angle, Xrcos, Yrcos, ht-1)
      coeff.insert(0, orients)

    return coeff

def MSE(img1, img2):
  return ((img2 - img1)**2).mean()

def fspecial(win = 11, sigma = 1.5):
  """
  2D gaussian mask - should give the same result as MATLAB's
  fspecial('gaussian',[shape],[sigma])
  """
  shape = (win, win)
  m, n = [(ss-1.)/2. for ss in shape]
  y, x = np.ogrid[-m:m+1,-n:n+1]
  h = np.exp( -(x*x + y*y) / (2.*sigma*sigma) )
  h[ h < np.finfo(h.dtype).eps*h.max() ] = 0
  sumh = h.sum()

  if sumh != 0:
    h /= sumh
  return h

class Metric:

  def __init__(self):
    self.win = 7

  def SSIM(self, img1, img2, K = (0.01, 0.03), L = 255):

    img1 = img1.astype(float)
    img2 = img2.astype(float)

    C1 = (K[0]*L) ** 2
    C2 = (K[1]*L) ** 2

    window = fspecial()
    window /= window.sum()

    mu1 = self.conv( img1, window)
    mu2 = self.conv( img2, window)

    mu1_sq = mu1 * mu1
    mu2_sq = mu2 * mu2

    sigma1_sq = self.conv( img1*img1, window) - mu1_sq;
    sigma2_sq = self.conv( img2*img2, window) - mu2_sq;
    sigma12 = self.conv( img1*img2, window) - mu1*mu2;

    ssim_map =  ((2 *mu1 *mu2 + C1)*(2*sigma12 + C2))/((mu1_sq + mu2_sq + C1)*(sigma1_sq + sigma2_sq + C2))

    return ssim_map.mean()

  def conv(self, a, b):
    """
    Larger matrix go first
    """
    return signal.correlate2d(a, b, mode = 'valid')
    # return cv2.filter2D(a, -1, b, anchor = (0,0))\
    #   [:(a.shape[0]-b.shape[0]+1), :(a.shape[1]-b.shape[1]+1)]

  def STSIM(self, im1, im2):
    assert im1.shape == im2.shape
    s = Steerable()

    pyrA = s.getlist(s.buildSCFpyr(im1))
    pyrB = s.getlist(s.buildSCFpyr(im2))

    stsim = map(self.pooling, pyrA, pyrB)

    return np.mean(stsim)

  def STSIM2(self, im1, im2):
    assert im1.shape == im2.shape

    s = Steerable()
    s_nosub = SteerableNoSub()

    pyrA = s.getlist(s.buildSCFpyr(im1))
    pyrB = s.getlist(s.buildSCFpyr(im2))
    stsim2 = map(self.pooling, pyrA, pyrB)

    # Add cross terms
    bandsAn = s_nosub.buildSCFpyr(im1)
    bandsBn = s_nosub.buildSCFpyr(im2)

    Nor = len(bandsAn[1])

    # Accross scale, same orientation
    for scale in range(2, len(bandsAn) - 1):
      for orient in range(Nor):
        im11 = np.abs(bandsAn[scale - 1][orient])
        im12 = np.abs(bandsAn[scale][orient])

        im21 = np.abs(bandsBn[scale - 1][orient])
        im22 = np.abs(bandsBn[scale][orient])

        stsim2.append(self.compute_cross_term(im11, im12, im21, im22).mean())

    # Accross orientation, same scale
    for scale in range(1, len(bandsAn) - 1):
      for orient in range(Nor - 1):
        im11 = np.abs(bandsAn[scale][orient])
        im21 = np.abs(bandsBn[scale][orient])

        for orient2 in range(orient + 1, Nor):
          im13 = np.abs(bandsAn[scale][orient2])
          im23 = np.abs(bandsBn[scale][orient2])
          stsim2.append(self.compute_cross_term(im11, im13, im21, im23).mean())

    return np.mean(stsim2)

  def STSIM_M(self, im):
    ss = Steerable(5)
    M, N = im.shape
    coeff = ss.buildSCFpyr(im)

    f = []
    # single subband statistics
    for s in ss.getlist(coeff):
      s = s.real
      shiftx = np.roll(s,1, axis = 0)
      shifty = np.roll(s,1, axis = 1)

      f.append(np.mean(s))
      f.append(np.var(s))
      f.append((shiftx * s).mean()/s.var())
      f.append((shifty * s).mean()/s.var())

    # correlation statistics
    # across orientations
    for orients in coeff[1:-1]:
      for (s1, s2) in list(itertools.combinations(orients, 2)):
        f.append((s1.real*s2.real).mean())

    for orient in range(len(coeff[1])):
      for height in range(len(coeff) - 3):
        s1 = coeff[height + 1][orient].real
        s2 = coeff[height + 2][orient].real

        s1 = cv2.resize(s1, (0,0), fx = 0.5, fy = 0.5)
        f.append((s1*s2).mean()/np.sqrt(s1.var())/np.sqrt(s2.var()))
    return np.array(f)

  def pooling(self, im1, im2):
    win = self.win
    tmp = np.power(self.compute_L_term(im1, im2) * self.compute_C_term(im1, im2) * \
      self.compute_C01_term(im1, im2) * self.compute_C10_term(im1, im2), 0.25)

    return tmp.mean()

  def compute_L_term(self, im1, im2):
    win = self.win
    C = 0.001
    window = fspecial(win, win/6)
    mu1 = np.abs(self.conv(im1, window))
    mu2 = np.abs(self.conv(im2, window))

    Lmap = (2 * mu1 * mu2 + C)/(mu1*mu1 + mu2*mu2 + C)
    return Lmap

  def compute_C_term(self, im1, im2):
    win = self.win
    C = 0.001
    window = fspecial(win, win/6)
    mu1 = np.abs(self.conv(im1, window))
    mu2 = np.abs(self.conv(im2, window))

    sigma1_sq = self.conv(np.abs(im1*im1), window) - mu1 * mu1
    sigma1 = np.sqrt(sigma1_sq)
    sigma2_sq = self.conv(np.abs(im2*im2), window) - mu2 * mu2
    sigma2 = np.sqrt(sigma2_sq)

    Cmap = (2*sigma1*sigma2 + C)/(sigma1_sq + sigma2_sq + C)
    return Cmap

  def compute_C01_term(self, im1, im2):
    win = self.win
    C = 0.001;
    window2 = 1/(win*(win-1)) * np.ones((win,win-1));

    im11 = im1[:, :-1]
    im12 = im1[:, 1:]
    im21 = im2[:, :-1]
    im22 = im2[:, 1:]

    mu11 = self.conv(im11, window2)
    mu12 = self.conv(im12, window2)
    mu21 = self.conv(im21, window2)
    mu22 = self.conv(im22, window2)

    sigma11_sq = self.conv(np.abs(im11*im11), window2) - np.abs(mu11*mu11)
    sigma12_sq = self.conv(np.abs(im12*im12), window2) - np.abs(mu12*mu12)
    sigma21_sq = self.conv(np.abs(im21*im21), window2) - np.abs(mu21*mu21)
    sigma22_sq = self.conv(np.abs(im22*im22), window2) - np.abs(mu22*mu22)

    sigma1_cross = self.conv(im11*np.conj(im12), window2) - mu11*np.conj(mu12)
    sigma2_cross = self.conv(im21*np.conj(im22), window2) - mu21*np.conj(mu22)

    rho1 = (sigma1_cross + C)/(np.sqrt(sigma11_sq)*np.sqrt(sigma12_sq) + C)
    rho2 = (sigma2_cross + C)/(np.sqrt(sigma21_sq)*np.sqrt(sigma22_sq) + C)
    C01map = 1 - 0.5*np.abs(rho1 - rho2)

    return C01map

  def compute_C10_term(self, im1, im2):
    win = self.win
    C = 0.001;
    window2 = 1/(win*(win-1)) * np.ones((win-1,win));

    im11 = im1[:-1, :]
    im12 = im1[1:, :]
    im21 = im2[:-1, :]
    im22 = im2[1:, :]

    mu11 = self.conv(im11, window2)
    mu12 = self.conv(im12, window2)
    mu21 = self.conv(im21, window2)
    mu22 = self.conv(im22, window2)

    sigma11_sq = self.conv(np.abs(im11*im11), window2) - np.abs(mu11*mu11)
    sigma12_sq = self.conv(np.abs(im12*im12), window2) - np.abs(mu12*mu12)
    sigma21_sq = self.conv(np.abs(im21*im21), window2) - np.abs(mu21*mu21)
    sigma22_sq = self.conv(np.abs(im22*im22), window2) - np.abs(mu22*mu22)

    sigma1_cross = self.conv(im11*np.conj(im12), window2) - mu11*np.conj(mu12)
    sigma2_cross = self.conv(im21*np.conj(im22), window2) - mu21*np.conj(mu22)

    rho1 = (sigma1_cross + C)/(np.sqrt(sigma11_sq)*np.sqrt(sigma12_sq) + C)
    rho2 = (sigma2_cross + C)/(np.sqrt(sigma21_sq)*np.sqrt(sigma22_sq) + C)
    C10map = 1 - 0.5*np.abs(rho1 - rho2)

    return C10map

  def compute_cross_term(self, im11, im12, im21, im22):

    C = 0.001;
    window2 = 1/(self.win**2)*np.ones((self.win, self.win));

    mu11 = self.conv(im11, window2);
    mu12 = self.conv(im12, window2);
    mu21 = self.conv(im21, window2);
    mu22 = self.conv(im22, window2);

    sigma11_sq = self.conv((im11*im11), window2) - (mu11*mu11);
    sigma12_sq = self.conv((im12*im12), window2) - (mu12*mu12);
    sigma21_sq = self.conv((im21*im21), window2) - (mu21*mu21);
    sigma22_sq = self.conv((im22*im22), window2) - (mu22*mu22);
    sigma1_cross = self.conv(im11*im12, window2) - mu11*(mu12);
    sigma2_cross = self.conv(im21*im22, window2) - mu21*(mu22);

    rho1 = (sigma1_cross + C)/(np.sqrt(sigma11_sq)*np.sqrt(sigma12_sq) + C);
    rho2 = (sigma2_cross + C)/(np.sqrt(sigma21_sq)*np.sqrt(sigma22_sq) + C);

    Crossmap = 1 - 0.5*abs(rho1 - rho2);
    return Crossmap
