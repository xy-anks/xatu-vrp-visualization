class VRPProblem:
    """
    Data model for a Capacitated Vehicle Routing Problem.
    """

    def __init__(
        self,
        depot,
        customers,
        vehicles,
        distance_matrix
    ):
        self.depot = depot
        self.customers = customers
        self.vehicles = vehicles
        self.distance_matrix = distance_matrix