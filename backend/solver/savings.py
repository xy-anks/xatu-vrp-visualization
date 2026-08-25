from backend.solver.base_solver import BaseSolver
from backend.solver.solver_result import SolverResult
from backend.utils.distance import calculate_total_distance

# ---- Internal helpers: algorithm-specific, kept outside the class ----

def calculate_savings(cities, depot, distance_matrix):
    """Compute the Clarke-Wright saving s(i,j) = d(0,i) + d(0,j) - d(i,j)
    for every customer pair, sorted in descending order."""
    savings = []
    for i in range(len(cities)):
        for j in range(i + 1, len(cities)):
            customer_i = cities[i]
            customer_j = cities[j]
            saving_value = (
                distance_matrix[depot][customer_i]
                + distance_matrix[depot][customer_j]
                - distance_matrix[customer_i][customer_j]
            )
            savings.append((saving_value, customer_i, customer_j))
    savings.sort(reverse=True)
    return savings


def find_route_index(routes, customer):
    """Return the index of the route containing the given customer."""
    for index, route in enumerate(routes):
        if customer in route:
            return index
    return None


def merge_routes(route_a, route_b, i, j):
    """
    Merge two routes via the edge (i, j).

    A merge is only possible when i and j are endpoints (head or tail)
    of their respective routes; otherwise return None.
    """
    a_head = route_a[1]
    a_tail = route_a[-2]
    b_head = route_b[1]
    b_tail = route_b[-2]

    if i == a_tail and j == b_head:
        return route_a[:-1] + route_b[1:]
    elif i == a_head and j == b_tail:
        return route_b[:-1] + route_a[1:]
    elif i == a_tail and j == b_tail:
        reversed_b = route_b[::-1]
        return route_a[:-1] + reversed_b[1:]
    elif i == a_head and j == b_head:
        reversed_a = route_a[::-1]
        return reversed_a[:-1] + route_b[1:]
    return None


# ---- Solver ----

class SavingsSolver(BaseSolver):
    """
    Clarke-Wright savings heuristic.

    Start with one round trip per customer, then repeatedly merge
    the route pair with the largest saving, subject to capacity.
    """

    name = "savings"
    description = "Clarke-Wright savings heuristic"

    def solve(self, problem):

        cities = problem.cities
        depot = problem.depot
        demands = problem.demands
        capacity = problem.capacity
        distance_matrix = problem.distance_matrix
        num_vehicles = problem.num_vehicles

        # 1. Initial routes:
        #    one round trip per customer
        routes = [
            [depot, city, depot]
            for city in cities
        ]

        # 2. Initial route loads
        route_loads = [
            demands[city]
            for city in cities
        ]

        # 3. Compute and sort savings
        savings = calculate_savings(
            cities,
            depot,
            distance_matrix
        )

        # 4. Try merging routes
        #    in descending order of saving
        for saving_value, i, j in savings:

            route_a_index = find_route_index(
                routes,
                i
            )

            route_b_index = find_route_index(
                routes,
                j
            )

            # Already on the same route
            if route_a_index == route_b_index:
                continue

            # Capacity check
            if (
                route_loads[route_a_index]
                + route_loads[route_b_index]
                > capacity
            ):
                continue

            route_a = routes[route_a_index]
            route_b = routes[route_b_index]

            new_route = merge_routes(
                route_a,
                route_b,
                i,
                j
            )

            if new_route is None:
                continue

            new_load = (
                route_loads[route_a_index]
                + route_loads[route_b_index]
            )

            # Keep smaller index
            if route_a_index < route_b_index:
                keep_index = route_a_index
                remove_index = route_b_index
            else:
                keep_index = route_b_index
                remove_index = route_a_index

            routes[keep_index] = new_route
            route_loads[keep_index] = new_load

            routes.pop(remove_index)
            route_loads.pop(remove_index)

        # 5. Vehicle count check
        if (
            num_vehicles is not None
            and len(routes) > num_vehicles
        ):
            raise ValueError(
                f"VEHICLE SHORTAGE: savings produced "
                f"{len(routes)} routes, "
                f"but only {num_vehicles} vehicles available"
            )

        return SolverResult(
            routes=routes,
            total_distance=calculate_total_distance(
                routes,
                distance_matrix
            ),
            algorithm=self.name
        )