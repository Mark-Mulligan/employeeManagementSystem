require('dotenv').config();
const mysql = require("mysql");
const cTable = require('console.table');
const inquirer = require('inquirer');
const util = require('./util');

var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "employee_tracker_db"
});

/* ----- STATIC INQUIRER PROMPTS ----- */
const mainMenuPrompt = {
    type: 'list',
    message: 'What would you like to do: ',
    choices: ['View All Employees', 'View All Employees Alphabetically', 'View All Employees By Department',
        'View All Employees By Manager', 'Add Employee', 'Remove Employee',
        'Update Employee Role', 'Update Employee Manager', 'View All Roles',
        'Add New Role', 'View All Departments', 'Add New Department'
    ],
    name: 'action'
}

const createDepartmentPropmt = {
    type: 'input',
    message: 'Enter the name of the new department: ',
    name: 'name'
};

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
    inquirer.prompt(mainMenuPrompt).then(res => {
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
        case 'View All Employees By Manger':
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
    inquirer.prompt({
        type: 'confirm',
        message: 'Would you like to do something else? ',
        name: 'continue'
    }).then(res => {
        if (res.continue) userMainMenu();
        else connection.end();
    })
}

/* ----- INQUIRY FUNCTIONS ----- */
function createEmployee() {
    connection.query(`select id, first_name, last_name from employees;`, function (err, allEmployees) {
        if (err) throw err;
        let employeeList = turnNameColsToArray(allEmployees);
        employeeList.push('No Manager');

        connection.query(`SELECT id, title FROM roles;`, function (error, allRoles) {
            if (error) throw error;
            let rolesArr = util.createArrayFromSqlData(allRoles, 'title');

            inquirer.prompt([{
                    type: 'input',
                    message: `Enter employee's first name: `,
                    name: 'firstName'
                },
                {
                    type: 'input',
                    message: `Enter employee's last name: `,
                    name: 'lastName'
                },
                {
                    type: 'list',
                    message: `Choose employee's role: `,
                    choices: rolesArr,
                    name: 'role'
                },
                {
                    type: 'list',
                    message: `Choose employee's manager`,
                    choices: employeeList,
                    name: 'manager'
                }
            ]).then(res => {
                let roleId = util.getIdOfSqlTarget(allRoles, 'title', res.role);
                if (res.manager === 'No Manager') createEmployeeQuery(res.firstName, res.lastName, roleId, null);
                else {
                    let manager = separateIdFirstLastName(res.manager);
                    createEmployeeQuery(res.firstName, res.lastName, roleId, manager.id);
                }
            })
        });
    })
}

function deleteEmployee() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, results) {
        if (error) throw error;
        let employeesAsArr = turnNameColsToArray(results);

        inquirer.prompt({
            type: 'list',
            message: 'Choose employee to remove: ',
            choices: employeesAsArr,
            name: 'employee'
        }).then(res => {
            let selection = separateIdFirstLastName(res.employee);
            deleteEmployeeQuery(selection);
        })
    })
}

function updateEmployeeRole() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, results) {
        if (error) throw error;
        let employeesAsArr = turnNameColsToArray(results);

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
                let employeeId = separateIdFirstLastName(res.employee);
                let roleId = util.getIdOfSqlTarget(allRoles, 'title', res.updatedRole);
                updateEmployeeRoleQuery(employeeId, res.updatedRole, roleId);
            })
        })
    })
}

function updateEmployeeManager() {
    connection.query(`Select id, first_name, last_name FROM employees;`, function (error, results) {
        if (error) throw error;
        let employeesAsArr = turnNameColsToArray(results);

        inquirer.prompt({
            type: 'list',
            message: 'Choose employee to update: ',
            choices: employeesAsArr,
            name: 'employee'
        }).then(res => {
            let selectedEmployee = separateIdFirstLastName(res.employee);
            connection.query(`Select id, first_name, last_name FROM employees WHERE id != ${selectedEmployee.id};`, function (err, results) {
                if (err) throw err;
                let managersAsArr = turnNameColsToArray(results);

                inquirer.prompt({
                    type: 'list',
                    message: 'Choose manger for employee: ',
                    choices: managersAsArr,
                    name: 'manager'
                }).then(res => {
                    let selectedManager = separateIdFirstLastName(res.manager);
                    updateEmployeManagerQuery(selectedEmployee, selectedManager);
                })
            })
        });
    })
}

function createRole() {
    connection.query(`Select * from departments`, function (err, departmentResults) {
        if (err) throw err;
        let departments = util.createArrayFromSqlData(departmentResults, 'name');

        inquirer.prompt([{
                type: 'input',
                message: 'Enter the name of the role: ',
                name: 'roleName'
            },
            {
                type: 'number',
                message: 'Enter the salary for this position (numbers only): ',
                name: 'salary'
            },
            {
                type: 'list',
                message: 'Choose the department that the role belong to: ',
                choices: departments,
                name: 'department'
            }
        ]).then(res => {
            let departmentId = util.getIdOfSqlTarget(departmentResults, 'name', res.department);
            createRoleQuery(res.roleName, res.salary, departmentId);
        })
    });
}

function createDepartment() {
    inquirer.prompt(createDepartmentPropmt).then(res => {
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

function deleteEmployeeQuery(nameObj) {
    connection.query(`DELETE FROM employees WHERE id = ?`, [nameObj.id], function (err, results) {
        if (err) throw err;
        console.log(`${nameObj.firstName} ${nameObj.lastName} removed from employees.`);
        continueProgram();
    });

}

function updateEmployeeRoleQuery(nameObj, newRoleTitle, newRoleId) {
    connection.query(`UPDATE employees SET role_id = ? WHERE id = ?`, [newRoleId, nameObj.id], function (error, results) {
        if (error) throw error;
        console.log(`${nameObj.firstName} ${nameObj.lastName}'s role was updated to ${newRoleTitle}`);
        continueProgram();
    })
}

function updateEmployeManagerQuery(employeeObj, newManagerObj) {
    connection.query(`UPDATE employees SET manager_id = ${newManagerObj.id} Where id = ${employeeObj.id};`, function (error, results) {
        if (error) throw error;
        console.log(`${employeeObj.firstName} ${employeeObj.lastName}'s manager was updated to ${newManagerObj.firstName} ${newManagerObj.lastName}`);
        continueProgram();
    })
}

/* ---- OTHER FUNCTIONS ----- */
function turnNameColsToArray(input) {
    let tempResult = '';
    let formattedResult = [];

    for (let i = 0; i < input.length; i++) {
        tempResult = `id:${input[i].id} ${input[i].first_name} ${input[i].last_name}`;
        formattedResult.push(tempResult);
    }
    return formattedResult;
}

function separateIdFirstLastName(name) {
    let nameArr = name.split(' ');
    return {
        id: getNumFromIdString(nameArr[0]),
        firstName: nameArr[1],
        lastName: nameArr[2]
    };
}

function getNumFromIdString(input) {
    let findNums = /[0-9]+/;
    let result = input.match(findNums);
    return Number(result);
}