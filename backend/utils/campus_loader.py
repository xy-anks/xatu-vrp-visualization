import json

from backend.models.depot import Depot
from backend.models.customer import Customer
from backend.models.vehicle import Vehicle
from backend.models.vrp_problem import VRPProblem
from backend.utils.distance import build_distance_matrix


def load_campus_data(path):
    """
    Load campus logistics data from json file.

    Return:
        depot
        customers
        vehicles
    """

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)


    # ---------- Depot ----------
    depot_data = data["depot"]

    depot = Depot(
        id=depot_data["id"],
        name=depot_data["name"],
        latitude=depot_data["latitude"],
        longitude=depot_data["longitude"]
    )


    # ---------- Customers ----------
    customers = []

    for item in data["buildings"]:

        customer = Customer(
            id=item["id"],
            name=item["name"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            demand=item["demand"]
        )

        customers.append(customer)



    # ---------- Vehicles ----------
    vehicles = []

    vehicle_info = data["vehicles"]

    for i in range(vehicle_info["number"]):

        vehicle = Vehicle(
            id=i,
            capacity=vehicle_info["capacity"]
        )

        vehicles.append(vehicle)



    return depot, customers, vehicles



def create_campus_problem(path):
    """
    Create a VRPProblem from campus json data.
    """

    # 1. Load objects
    depot, customers, vehicles = load_campus_data(path)


    # 2. Combine all locations
    points = [depot] + customers


    # 3. Build distance matrix
    distance_matrix = build_distance_matrix(points)


    # 4. Create VRPProblem

    problem = VRPProblem(
        depot=depot,
        customers=customers,
        vehicles=vehicles,
        distance_matrix=distance_matrix
    )


    return problem