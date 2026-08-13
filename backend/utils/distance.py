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
    Build a symmetric distance matrix for all locations.
    """
    
    # ① 点的数量
    n = len(points)

    # ② 创建一个 n × n 的全 0 矩阵
    matrix = [[0] * n for _ in range(n)]

    # ③ 只计算矩阵的上三角部分
    for i in range(n):
        for j in range(i + 1, n):

            # ④ 计算两个点之间的距离
            distance = calculate_distance(points[i], points[j])

            # ⑤ 同时填入两个对称位置
            matrix[i][j] = distance
            matrix[j][i] = distance

    # ⑥ 返回距离矩阵
    return matrix