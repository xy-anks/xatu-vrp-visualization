from backend.solver.solver_registry import get_solver


def test_solver_registry():

    nearest = get_solver("nearest_neighbor")
    savings = get_solver("savings")
    gurobi = get_solver("gurobi")

    print(type(nearest))
    print(type(savings))
    print(type(gurobi))

    # Test invalid solver name
    try:
        get_solver("abc")
    except ValueError as e:
        print("Invalid solver test passed:", e)


if __name__ == "__main__":
    test_solver_registry()