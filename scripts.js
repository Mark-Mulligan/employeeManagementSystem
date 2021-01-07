module.exports = {
    viewAllEmployees(orderCriteria) {
        return `Select a.id, a.first_name, a.last_name, roles.title, 
        departments.name as department, roles.salary, CONCAT(b.first_name, ' ', b.last_name) as manager
        FROM employees a join roles on a.role_id = roles.id 
        join departments on roles.department_id = departments.id
        left join employees b on b.id = a.manager_id or a.manager_id = null
        order by ${orderCriteria};`
    },

    viewAllRoles: `select roles.id, title, salary, departments.name as department from roles 
    join departments where roles.department_id = departments.id;`,

    viewAllDepartments: `select * from departments`
}