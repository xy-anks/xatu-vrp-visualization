class SolverResult:
    """
    Unified result returned by all VRP solvers.
    """

    def __init__(
        self,
        routes,
        total_distance,
        algorithm
    ):
        self.routes = routes
        self.total_distance = total_distance
        self.algorithm = algorithm