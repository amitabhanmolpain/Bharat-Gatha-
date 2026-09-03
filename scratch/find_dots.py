"""Utility to detect coordinates of marked coordinate dots on map images."""

from PIL import Image
import numpy as np


def main():
    """Find and compute normalized percentage coordinates of dark dots on map."""
    img = Image.open('scratch/red_fort_plaza_dots.jpg')
    arr = np.array(img)

    # Find pixels that are purely black (0,0,0) or very close to it
    threshold = 10
    mask = (arr[:, :, 0] < threshold) & (arr[:, :, 1] < threshold) & (arr[:, :, 2] < threshold)

    # Get coordinates
    y_coords, x_coords = np.where(mask)

    height, width = arr.shape[:2]

    if len(x_coords) > 0:
        # Cluster the points to find the centers of the dots
        from sklearn.cluster import DBSCAN
        points = np.column_stack((x_coords, y_coords))
        clustering = DBSCAN(eps=20, min_samples=10).fit(points)
        
        unique_labels = set(clustering.labels_)
        for label in unique_labels:
            if label != -1:  # ignore noise
                cluster_points = points[clustering.labels_ == label]
                cx = np.mean(cluster_points[:, 0])
                cy = np.mean(cluster_points[:, 1])
                print(f"Dot found at: x={cx/width*100:.2f}%, y={cy/height*100:.2f}%")
    else:
        print("No black dots found.")


if __name__ == '__main__':
    main()
