from utils.distance import build_distance_matrix
from models.station import Station
from models.delivery_point import DeliveryPoint


station = Station(
    id=1,
    name="物流驿站",
    latitude=0,
    longitude=0
)

point1 = DeliveryPoint(
    id=2,
    name="1号宿舍楼",
    latitude=3,
    longitude=4,
    demand=10
)

point2 = DeliveryPoint(
    id=3,
    name="2号宿舍楼",
    latitude=6,
    longitude=8,
    demand=20
)


points = [station, point1, point2]

matrix = build_distance_matrix(points)

print(matrix)
