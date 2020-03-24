import matplotlib.path as mpltPath
import numpy as np
from scipy.spatial import Voronoi
from sklearn.cluster import KMeans

def sample(num_centers, num_samples, points, scale=False):
    n = points.shape[0]

    kmeans_transformed_data = KMeans(num_centers).fit_transform(points)
    centers = np.argmin(kmeans_transformed_data, axis=0)
    center_points = points[centers]

    regions, vertices = voronoi_finite_polygons_2d(Voronoi(center_points))

    polygon_size_hist = np.zeros(len(regions))
    points_by_region = np.zeros((n, len(regions)))

    for r, region in enumerate(regions):
        polygon = vertices[region]
        path = mpltPath.Path(polygon)
        points_inside = path.contains_points(points)
        points_by_region[:, r] = points_inside.astype(bool)
        polygon_size_hist[r] = points_inside.sum()

    # The sum of the hist should be the same as the number of all drawings
    assert polygon_size_hist.sum().astype(int) == n

    # Diminish/compress differences between regions
    adjusted_hist = polygon_size_hist + np.median(polygon_size_hist) * scale
    adjusted_hist /= adjusted_hist.sum()
    adjusted_hist *= num_samples - num_centers
    adjusted_hist = np.round(adjusted_hist).astype(int)

    diff = ((num_samples - num_centers) - adjusted_hist.sum()).astype(int)

    if np.abs(diff) > 0:
        adjusted_hist[np.random.choice(num_centers, np.abs(diff))] += 1 * np.sign(diff)

    choices = [centers]

    for r, region in enumerate(regions):
        choices.append(np.random.choice(
            np.where(points_by_region[:, r])[0],
            adjusted_hist[r]
        ))

    return np.hstack(choices)


# From https://stackoverflow.com/a/20678647/981933
def voronoi_finite_polygons_2d(vor, radius=None):
    """
    Reconstruct infinite voronoi regions in a 2D diagram to finite
    regions.

    Parameters
    ----------
    vor : Voronoi
        Input diagram
    radius : float, optional
        Distance to 'points at infinity'.

    Returns
    -------
    regions : list of tuples
        Indices of vertices in each revised Voronoi regions.
    vertices : list of tuples
        Coordinates for revised Voronoi vertices. Same as coordinates
        of input vertices, with 'points at infinity' appended to the
        end.

    """

    if vor.points.shape[1] != 2:
        raise ValueError("Requires 2D input")

    new_regions = []
    new_vertices = vor.vertices.tolist()

    center = vor.points.mean(axis=0)
    if radius is None:
        radius = vor.points.ptp().max()

    # Construct a map containing all ridges for a given point
    all_ridges = {}
    for (p1, p2), (v1, v2) in zip(vor.ridge_points, vor.ridge_vertices):
        all_ridges.setdefault(p1, []).append((p2, v1, v2))
        all_ridges.setdefault(p2, []).append((p1, v1, v2))

    # Reconstruct infinite regions
    for p1, region in enumerate(vor.point_region):
        vertices = vor.regions[region]

        if all(v >= 0 for v in vertices):
            # finite region
            new_regions.append(vertices)
            continue

        # reconstruct a non-finite region
        ridges = all_ridges[p1]
        new_region = [v for v in vertices if v >= 0]

        for p2, v1, v2 in ridges:
            if v2 < 0:
                v1, v2 = v2, v1
            if v1 >= 0:
                # finite ridge: already in the region
                continue

            # Compute the missing endpoint of an infinite ridge

            t = vor.points[p2] - vor.points[p1] # tangent
            t /= np.linalg.norm(t)
            n = np.array([-t[1], t[0]])  # normal

            midpoint = vor.points[[p1, p2]].mean(axis=0)
            direction = np.sign(np.dot(midpoint - center, n)) * n
            far_point = vor.vertices[v2] + direction * radius

            new_region.append(len(new_vertices))
            new_vertices.append(far_point.tolist())

        # sort region counterclockwise
        vs = np.asarray([new_vertices[v] for v in new_region])
        c = vs.mean(axis=0)
        angles = np.arctan2(vs[:,1] - c[1], vs[:,0] - c[0])
        new_region = np.array(new_region)[np.argsort(angles)]

        # finish
        new_regions.append(new_region.tolist())

    return new_regions, np.asarray(new_vertices)
