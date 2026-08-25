import math

def calculate_distance(point1, point2):
    """
    Calculate the distance between two locations.
    """

    latitude1 = point1.latitude
    longitude1 = point1.longitude
    latitude2 = point2.latitude
    longitude2 = point2.longitude

    delta_latitude = latitude1-latitude2

    delta_longitude = longitude1-longitude2

    return math.sqrt(delta_latitude**2 + delta_longitude**2)


def build_distance_matrix(points):
    """
    Build a symmetric distance matrix for all locations.
    """

    n = len(points)

    matrix = [[0] * n for _ in range(n)]

    for i in range(n):
        for j in range(i + 1, n):

            distance = calculate_distance(points[i], points[j])

            matrix[i][j] = distance

            matrix[j][i] = distance

    return matrix

def calculate_route_distance(route, distance_matrix):
    """
    Calculate the total distance of a route.
    """

    total_distance = 0

    for i in range(len(route) - 1):
        current = route[i]
        next_node = route[i + 1]

        total_distance += distance_matrix[current][next_node]

    return total_distance

def calculate_total_distance(routes, distance_matrix):
    """
    Calculate the total distance of all routes.
    """

    total_distance = 0

    for route in routes:
        total_distance += calculate_route_distance(
            route,
            distance_matrix
        )

    return total_distance