// VIEW ALL EMPLOYEES
export function getAllEmployees() {
    connection.query(`Select employees.id, employees.first_name, employees.last_name, roles.title, departments.name, roles.salary, employees.manager_id 
    FROM employees join roles on employees.role_id = roles.id 
    join departments on roles.department_id = departments.id;`, function (error, results, fields) {
        if (error) throw error;
        const table = cTable.getTable(results)
        console.log(table);
    });
}