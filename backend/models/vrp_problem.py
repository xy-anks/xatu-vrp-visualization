class VRPProblem:
    """
    Represents a VRP problem instance.
    """
    def __init__(
        self,
        station,
        delivery_points,
        vehicles
    ):
        self.station = station
        self.delivery_points = delivery_points
        self.vehicles = vehicles