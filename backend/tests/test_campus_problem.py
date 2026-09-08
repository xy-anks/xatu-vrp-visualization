from backend.utils.campus_loader import create_campus_problem


if __name__ == "__main__":

    problem = create_campus_problem(
        "data/campus.json"
    )


    print("Depot:")
    print(problem.depot.name)


    print("\nCustomers:")

    for customer in problem.customers:
        print(
            customer.id,
            customer.name,
            customer.demand
        )


    print("\nVehicles:")

    for vehicle in problem.vehicles:
        print(
            vehicle.id,
            vehicle.capacity
        )


    print("\nDistance Matrix:")

    for row in problem.distance_matrix:
        print(row)