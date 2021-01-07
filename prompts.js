module.exports = {
    mainMenuPrompt: {
        type: 'list',
        message: 'What would you like to do: ',
        choices: ['View All Employees', 'View All Employees Alphabetically', 'View All Employees By Department',
            'View All Employees By Manager', 'Add Employee', 'Remove Employee',
            'Update Employee Role', 'Update Employee Manager', 'View All Roles',
            'Add New Role', 'View All Departments', 'Add New Department'
        ],
        name: 'action'
    },

    createDepartmentPrompt: {
        type: 'input',
        message: 'Enter the name of the new department: ',
        name: 'name'
    },

    continueProgramPrompt: {
        type: 'confirm',
        message: 'Would you like to do something else? ',
        name: 'continue'
    },

    updateEmployeeManagerPrompt1(employeesAsArr) {
        return {
            type: 'list',
            message: 'Choose employee to update: ',
            choices: employeesAsArr,
            name: 'employee'
        }
    },

    updateEmployeeManagerPrompt2(managersAsArr) {
        return {
            type: 'list',
            message: 'Choose manger for employee: ',
            choices: managersAsArr,
            name: 'manager'
        }
    },

    createEmployeePrompts(rolesArr, employeeList) {
        return [{
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
        ]
    },

    deleteEmployeePrompt(employeesAsArr) {
        return {
            type: 'list',
            message: 'Choose employee to remove: ',
            choices: employeesAsArr,
            name: 'employee'
        }
    },

    createRolesPrompt(departmentsArr) {
        return [{
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
                choices: departmentsArr,
                name: 'department'
            }
        ]
    }
}