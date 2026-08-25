class VRPProblem:
    """
    Data model for a Capacitated Vehicle Routing Problem (CVRP).
    """

    def __init__(
        self,
        cities,
        depot,
        demands,
        capacity,
        distance_matrix,
        num_vehicles=None
    ):
        self.cities = cities
        self.depot = depot
        self.demands = demands
        self.capacity = capacity
        self.distance_matrix = distance_matrix
        self.num_vehicles = num_vehicles