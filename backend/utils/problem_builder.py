from backend.models.depot import Depot
from backend.models.customer import Customer
from backend.models.vehicle import Vehicle
from backend.models.vrp_problem import VRPProblem
from backend.utils.distance import build_distance_matrix


def build_problem(scene, orders, vehicle_count, vehicle_capacity):
    """
    Construct a solver-ready VRPProblem from a static scene and a
    dynamic order list (called per simulation request).

    Pipeline:
      1. Aggregate order demands by customer_id (multiple orders to
         the same node are merged into one delivery demand).
      2. Keep only customers that have at least one order.
      3. Assign compact solver indices:
             depot    -> solver id 0
             customers -> solver ids 1..m (continuous)
         and build both directions of the id mapping.
      4. Build solver-side Depot/Customer/Vehicle objects. Scene
         normalized (x, y) coordinates are mapped onto the existing
         generic latitude/longitude fields (y -> latitude, x ->
         longitude), so distance.py and the solver layer stay
         untouched.
      5. Build the Euclidean distance matrix over [depot] + customers
         in solver-id order.

    Args:
        scene:            SceneMap (static world)
        orders:           list[Order] (dynamic, order layer)
        vehicle_count:    number of available vehicles
        vehicle_capacity: capacity per vehicle

    Returns:
        (problem, solver_to_scene)
        where solver_to_scene is {solver_id(int): scene_node_id(str)},
        including 0 -> depot scene id. It lets the API layer translate
        solver routes back to stable scene ids.

    Raises:
        ValueError: no orders, invalid vehicle parameters, or an order
                    referencing an unknown / non-customer node.
    """

    if not orders:
        raise ValueError("Cannot build a problem with no orders")

    if (
        not isinstance(vehicle_count, int)
        or vehicle_count < 1
    ):
        raise ValueError(
            f"vehicle_count must be a positive integer, "
            f"got {vehicle_count!r}"
        )

    if (
        not isinstance(vehicle_capacity, (int, float))
        or vehicle_capacity <= 0
    ):
        raise ValueError(
            f"vehicle_capacity must be positive, "
            f"got {vehicle_capacity!r}"
        )

    # ---- 1. Aggregate demand per customer node ----
    aggregated_demand = {}

    for order in orders:
        if order.customer_id not in aggregated_demand:
            aggregated_demand[order.customer_id] = 0
        aggregated_demand[order.customer_id] += order.demand

    # Every ordered id must reference an existing customer node
    scene_customer_ids = {
        customer.id for customer in scene.customers
    }

    for customer_id in aggregated_demand:
        if customer_id == scene.depot.id:
            raise ValueError(
                f"Order references depot node '{customer_id}', "
                f"which cannot be a delivery customer"
            )
        if customer_id not in scene_customer_ids:
            raise ValueError(
                f"Order references unknown customer node "
                f"'{customer_id}' in scene '{scene.scene_id}'"
            )

    # ---- 2 & 3. Select ordered customers and assign solver ids ----
    # Iterate scene.customers for a deterministic order independent of
    # the order list ordering.
    ordered_nodes = [
        customer
        for customer in scene.customers
        if customer.id in aggregated_demand
    ]

    scene_to_solver = {scene.depot.id: 0}
    solver_to_scene = {0: scene.depot.id}

    for solver_id, node in enumerate(ordered_nodes, start=1):
        scene_to_solver[node.id] = solver_id
        solver_to_scene[solver_id] = node.id

    # ---- 4. Build solver-side model objects ----
    solver_depot = Depot(
        id=0,
        name=scene.depot.name,
        latitude=scene.depot.y,
        longitude=scene.depot.x
    )

    solver_customers = [
        Customer(
            id=scene_to_solver[node.id],
            name=node.name,
            latitude=node.y,
            longitude=node.x,
            demand=aggregated_demand[node.id]
        )
        for node in ordered_nodes
    ]

    solver_vehicles = [
        Vehicle(
            id=i,
            capacity=vehicle_capacity
        )
        for i in range(vehicle_count)
    ]

    # ---- 5. Distance matrix in solver-id order ----
    points = [solver_depot] + solver_customers
    distance_matrix = build_distance_matrix(points)

    problem = VRPProblem(
        depot=solver_depot,
        customers=solver_customers,
        vehicles=solver_vehicles,
        distance_matrix=distance_matrix
    )

    return problem, solver_to_scene
