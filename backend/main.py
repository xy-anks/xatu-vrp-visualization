from models.station import Station
from models.delivery_point import DeliveryPoint
from models.vehicle import Vehicle
from models.vrp_problem import VRPProblem


station = Station(
    0,
    "Campus Station",
    34.25,
    109.01
)


building = DeliveryPoint(
    1,
    "Dorm Building 1",
    34.25,
    109.02,
    20
)


vehicle = Vehicle(
    1,
    50,
    15
)


problem = VRPProblem(
    station,
    [building],
    [vehicle]
)


print(problem.delivery_points[0].name)