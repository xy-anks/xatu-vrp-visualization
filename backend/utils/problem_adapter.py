def convert_problem_to_solver_input(problem):
    """
    Convert VRPProblem object into solver input format.
    """

    # customer ids
    cities = [
        customer.id
        for customer in problem.customers
    ]


    # depot id
    depot = problem.depot.id


    # demands
    demands = {
        customer.id: customer.demand
        for customer in problem.customers
    }


    # vehicle capacity
    capacity = problem.vehicles[0].capacity


    # vehicle number
    num_vehicles = len(problem.vehicles)


    return {
        "cities": cities,
        "depot": depot,
        "demands": demands,
        "capacity": capacity,
        "distance_matrix": problem.distance_matrix,
        "num_vehicles": num_vehicles
    }