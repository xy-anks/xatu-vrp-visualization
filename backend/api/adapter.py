def convert_distance_matrix(distance_matrix):
    """
    Convert JSON distance matrix keys from str to int.
    """

    converted = {}

    for i, row in distance_matrix.items():

        i = int(i)

        converted[i] = {}

        for j, value in row.items():

            j = int(j)

            converted[i][j] = value

    return converted



def convert_demands(demands):
    """
    Convert demand dictionary keys from str to int.
    """

    return {
        int(node): demand
        for node, demand in demands.items()
    }