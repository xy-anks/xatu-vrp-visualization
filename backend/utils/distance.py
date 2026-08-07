import math

def calculate_distance(point1, point2):
    """
    Calculate the distance between two locations.
    """

    # ① 取出两个点的经纬度
    latitude1 = point1.latitude
    longitude1 = point1.longitude
    latitude2 = point2.latitude
    longitude2 = point2.longitude

    # ② 计算横坐标差
    delta_latitude = latitude1-latitude2

    # ③ 计算纵坐标差
    delta_longitude = longitude1-longitude2

    # ④ 返回距离
    return math.sqrt(delta_latitude**2 + delta_longitude**2)


def build_distance_matrix(points):
    """
    Build a distance matrix for all locations.
    """

    matrix = []

    for i in range(len(points)):

        row = []

        for j in range(len(points)):

            distance = calculate_distance(points[i], points[j])

            row.append(distance)

        matrix.append(row)

    return matrix