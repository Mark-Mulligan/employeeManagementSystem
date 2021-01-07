require('dotenv').config();
const mysql = require("mysql");
const cTable = require('console.table');
const inquirer = require('inquirer');
const util = require('./util');
const prompts = require('./prompts');

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "employee_tracker_db"
});

/* ----- VIEW ONLY QUERIES ----- */
function viewAllEmployeesScriptOrderedBy(order) {
    return `Select a.id, a.first_name, a.last_name, roles.title, 
departments.name as department, roles.salary, CONCAT(b.first_name, ' ', b.last_name) as manager
    FROM employees a join roles on a.role_id = roles.id 
    join departments on roles.department_id = departments.id
    left join employees b on b.id = a.manager_id or a.manager_id = null
    order by ${order};`
}

const viewAllRolesScript = `select roles.id, title, salary, departments.name as department from roles 
join departments where roles.department_id = departments.id;`;

const viewAllDepartmentsScript = `select * from departments`;
/* ----- DATABASE CONNECTION ----- */
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
    userMainMenu();
});

/* ----- MAIN PROGRAM LOGIC ----- */
function userMainMenu() {
    inquirer.prompt(prompts.mainMenuPrompt).then(res => {
        console.log(res.action);
        handleMainMenuSelect(res.action);
    })
}

function handleMainMenuSelect(optionSelected) {
    switch (optionSelected) {
        case 'View All Employees':
            viewAllQuery(viewAllEmployeesScriptOrderedBy('id'));
            break;
        case 'View All Employees By Department':
            viewAllQuery(viewAllEmployeesScriptOrderedBy('department'));
            break;
        case 'View All Employees By Manager':
            viewAllQuery(viewAllEmployeesScriptOrderedBy('manager'));
            break;
        case 'View All Employees Alphabetically':
            viewAllQuery(viewAllEmployeesScriptOrderedBy('last_name'));
            break;
        case 'Add Employee':
            createEmployee();
            break;
        case 'Remove Employee':
            deleteEmployee();
            break;
        case 'Update Employee Role':
            updateEmployeeRole();
            break;
        case 'Update Employee Manager':
            updateEmployeeManager();
            break;
        case 'View All Roles':
            viewAllQuery(viewAllRolesScript);
            break;
        case 'Add New Role':
            createRole();
            break;
        case 'View All Departments':
            viewAllQuery(viewAllDepartmentsScript);
            break;
        case 'Add New Department':
            createDepartment();
            break;
        default:
            console.log('default triggered');
    }
}

//Had to put this inside each query function because of async activity with database.
function continueProgram() {
    inquirer.prompt(prompts.continueProgramPrompt).then(res => {
        if (res.continue) userMainMenu();
        else connection.end();
    })
}

/* ----- INQUIRY FUNCTIONS ----- */
function createEmployee() {
    connection.query(`select id, first_name, last_name from employees;`, function (err, allEmployees) {
        if (err) throw err;
        let employeeList = util.createArrOfNames(allEmployees);
        employeeList.push('No Manager');

        connection.query(`SELECT id, title FROM roles;`, function (error, allRoles) {
            if (error) throw error;
            let rolesArr = util.createArrayFromSqlData(allRoles, 'title');

            inquirer.prompt(prompts.createEmployeePrompts(rolesArr, employeeList)).then(res => {
                let roleId = util.getIdOfSqlTarget(allRoles, 'title', res.role);

                if (res.manager === 'No Manager') {
                    createEmployeeQuery(res.firstName, res.lastName, roleId, null);
                }
                else {
                    let manager = util.createNameObj(res.manager);
                    let managerId = util.getIdOfEmployee(allEmployees, manager.firstName, manager.lastName);
                    createEmployeeQuery(res.firstName, res.lastName, roleId, managerId);
                }
            })
        });
    })
}

function deleteEmployee() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, allEmployees) {
        if (error) throw error;
        let employeesAsArr = util.createArrOfNames(allEmployees);

        inquirer.prompt(prompts.deleteEmployeePrompt(employeesAsArr)).then(res => {
            let selectedEmployee = util.createNameObj(res.employee);
            let employeeId = util.getIdOfEmployee(allEmployees, selectedEmployee.firstName, selectedEmployee.lastName);
            deleteEmployeeQuery(employeeId, selectedEmployee);
        })
    })
}

function updateEmployeeRole() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, allEmployees) {
        if (error) throw error;
        let employeesAsArr = util.createArrOfNames(allEmployees);

        connection.query(`SELECT id, title FROM roles;`, function (err, allRoles) {
            if (err) throw err;
            let rolesArr = util.createArrayFromSqlData(allRoles, 'title');

            inquirer.prompt([{
                    type: 'list',
                    message: 'Choose employee to update: ',
                    choices: employeesAsArr,
                    name: 'employee'
                },
                {
                    type: 'list',
                    message: 'Choose new role: ',
                    choices: rolesArr,
                    name: 'updatedRole'
                }
            ]).then(res => {
                let selectedEmployee = util.createNameObj(res.employee);
                let employeeId = util.getIdOfEmployee(allEmployees, selectedEmployee.firstName, selectedEmployee.lastName);
                let roleId = util.getIdOfSqlTarget(allRoles, 'title', res.updatedRole);
                updateEmployeeRoleQuery(employeeId, selectedEmployee, res.updatedRole, roleId);
            })
        })
    })
}

function updateEmployeeManager() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, employees) {
        if (error) throw error;
        let employeesAsArr = util.createArrOfNames(employees);

        inquirer.prompt(prompts.updateEmployeeManagerPrompt1(employeesAsArr)).then(res => {
            let selectedEmployee = util.createNameObj(res.employee);
            let employeeId = util.getIdOfEmployee(employees, selectedEmployee.firstName, selectedEmployee.lastName);

            connection.query(`Select id, first_name, last_name FROM employees WHERE id != ${employeeId};`, function (err, possibleManagers) {
                if (err) throw err;
                let managersAsArr = util.createArrOfNames(possibleManagers);

                inquirer.prompt(prompts.updateEmployeeManagerPrompt2(managersAsArr)).then(res => {
                    let selectedManager = util.createNameObj(res.manager);
                    let managerId = util.getIdOfEmployee(possibleManagers, selectedManager.firstName, selectedManager.lastName);
                    updateEmployeManagerQuery(selectedEmployee, selectedManager, employeeId, managerId);
                })
            })
        });
    })
}

function createRole() {
    connection.query(`Select * from departments`, function (err, departmentResults) {
        if (err) throw err;
        let departments = util.createArrayFromSqlData(departmentResults, 'name');

        inquirer.prompt(prompts.createRolesPrompt(departments)).then(res => {
            let departmentId = util.getIdOfSqlTarget(departmentResults, 'name', res.department);
            createRoleQuery(res.roleName, res.salary, departmentId);
        })
    });
}

function createDepartment() {
    inquirer.prompt(prompts.createDepartmentPrompt).then(res => {
        createDepartmentQuery(res.name);
    })
}

/* ----- QUERIES ----- */
function viewAllQuery(mySqlScript) {
    connection.query(mySqlScript, function (err, results) {
        if (err) throw err;
        const table = cTable.getTable(results);
        console.log('');
        console.log(table);
        continueProgram();
    })
}

function createEmployeeQuery(firstName, lastName, roleId, managerId) {
    connection.query(`INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`,
        [firstName, lastName, roleId, managerId],
        function (error, results) {
            if (error) throw error;
            console.log('New employee added.');
            continueProgram();
        })
}

function createDepartmentQuery(name) {
    connection.query(`insert into departments (name) values (?)`, [name], function (err, results) {
        if (err) throw err;
        console.log('new Department Added');
        continueProgram();
    })
}

function createRoleQuery(title, salary, department_id) {
    connection.query(`insert into roles (title, salary, department_id) 
    values (?, ?, ?)`, [title, salary, department_id], function (err, results) {
        if (err) throw err;
        console.log('New Role Added');
        continueProgram();
    })
}

function deleteEmployeeQuery(employeeId, nameObj) {
    connection.query(`DELETE FROM employees WHERE id = ?`, [employeeId], function (err, results) {
        if (err) throw err;
        console.log(`${nameObj.firstName} ${nameObj.lastName} removed from employees.`);
        continueProgram();
    });

}

function updateEmployeeRoleQuery(employeeId, nameObj, newRoleTitle, newRoleId) {
    connection.query(`UPDATE employees SET role_id = ? WHERE id = ?`, [newRoleId, employeeId], function (error, results) {
        if (error) throw error;
        console.log(`${nameObj.firstName} ${nameObj.lastName}'s role was updated to ${newRoleTitle}`);
        continueProgram();
    })
}

function updateEmployeManagerQuery(employeeNameObj, managerNameObj, employeeId, managerId) {
    connection.query(`UPDATE employees SET manager_id = ? Where id = ?`, [managerId, employeeId], function (error, results) {
        if (error) throw error;
        console.log(`${employeeNameObj.firstName} ${employeeNameObj.lastName}'s manager was updated to ${managerNameObj.firstName} ${managerNameObj.lastName}`);
        continueProgram();
    })
}
