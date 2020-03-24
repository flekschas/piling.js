import os
import sys

from keras_tqdm import TQDMCallback, TQDMNotebookCallback
from tqdm import tqdm, tqdm_notebook

# Stupid Keras things is a smart way to always print. See:
# https://github.com/keras-team/keras/issues/1406
stderr = sys.stderr
sys.stderr = open(os.devnull, "w")
from keras.layers import Input, Conv2D, Dense, Flatten, Reshape, UpSampling2D
from keras.models import Model

sys.stderr = stderr

def create():
    input_img = Input(shape=(28, 28, 1), name='input')

    # 14x14x16 (3136)
    x = Conv2D(16, (3, 3), strides=2, activation='relu', padding='same', name='conv1')(input_img)
    # 7x7x8 (392)
    x = Conv2D(8, (3, 3), strides=2, activation='relu', padding='same', name='conv2')(x)
    # 4x4x8 (128)
    encoded = Conv2D(8, (3, 3), strides=2, activation='relu', padding='same', name='conv3')(x)
    # 128
    x = Flatten(name="flatten")(x)
    # 32
    x = Dense(32, activation='relu', name='dense1')(x)

    # Latent Space: 16
    encoded = Dense(16, activation='relu', name='dense2')(x)

    x = Dense(32, activation='relu', name='undense1')(encoded)
    x = Dense(128, activation='relu', name='undense2')(encoded)
    x = Reshape((4, 4, 8), name='unflatten')(x)
    x = Conv2D(8, (3, 3), activation='relu', padding='same', name='deconv1')(x)
    x = UpSampling2D((2, 2), name='destride1')(x)
    x = Conv2D(8, (3, 3), activation='relu', padding='same', name='deconv2')(x)
    x = UpSampling2D((2, 2), name='destride2')(x)
    x = Conv2D(16, (3, 3), activation='relu', name='deconv3')(x)
    x = UpSampling2D((2, 2), name='destride3')(x)
    decoded = Conv2D(1, (3, 3), activation='sigmoid', padding='same', name='output')(x)

    autoencoder = Model(input_img, decoded)
    autoencoder.compile(optimizer='adadelta', loss='binary_crossentropy')

    encoder = Model(input_img, encoded)

    return (encoder, autoencoder)

def is_ipynb():
    try:
        shell = get_ipython().__class__.__name__
        if shell == "ZMQInteractiveShell":
            return True  # Jupyter notebook or qtconsole
        elif shell == "TerminalInteractiveShell":
            return False  # Terminal running IPython
        else:
            return False  # Other type (?)
    except NameError:
        return False  # Probably standard Python interpreter

def get_tqdm(is_keras: bool = False):
    # Determine which tqdm to use
    if is_ipynb():
        if is_keras:
            return TQDMNotebookCallback
        else:
            return tqdm_notebook
    else:
        if is_keras:
            return TQDMCallback
        else:
            return tqdm
