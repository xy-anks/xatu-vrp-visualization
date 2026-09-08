from backend.utils.campus_loader import load_campus_data


if __name__ == "__main__":

    depot, customers, vehicles = load_campus_data(
        "data/campus.json"
    )


    print("Depot:")
    print(depot.name)


    print("\nCustomers:")

    for customer in customers:
        print(
            customer.id,
            customer.name,
            customer.demand
        )


    print("\nVehicles:")

    for vehicle in vehicles:
        print(
            vehicle.id,
            vehicle.capacity
        )