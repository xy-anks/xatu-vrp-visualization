from backend.models.vrp_problem import VRPProblem


class BaseSolver:
    """
    Unified interface for all VRP solvers.
    """

    name = "base"
    description = ""

    def solve(self, problem: VRPProblem):
        raise NotImplementedError(
            "Subclasses must implement solve()"
        )