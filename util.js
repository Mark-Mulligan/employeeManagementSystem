function createArrayFromSqlData(sqlData, key) {
    let newArr = [];
    for (let i = 0; i < sqlData.length; i++) {
        newArr.push(sqlData[i][key]);
    }
    return newArr;
}

function createArrOfNames(sqlData) {
    let newArr = [];
    for (let i = 0; i < sqlData.length; i++) {
        newArr.push(`${sqlData[i].first_name} ${sqlData[i].last_name}`);
    }
    return newArr;
}

function getIdOfSqlTarget(sqlData, key, targetValue) {
    for (let i = 0; i < sqlData.length; i++) {
        if (sqlData[i][key] === targetValue) {
            return sqlData[i].id;
        }
    }
}

function getIdOfEmployee(sqlData, firstName, lastName) {
    for (let i = 0; i < sqlData.length; i++) {
        if (sqlData[i].first_name === firstName && sqlData[i].last_name === lastName) {
            return sqlData[i].id;
        }
    }
}

function createNameObj(name) {
    let nameArr = name.split(' ');
    return {firstName: nameArr[0], lastName: nameArr[1]};
}

module.exports.createArrayFromSqlData = createArrayFromSqlData;
module.exports.createArrOfNames = createArrOfNames;
module.exports.getIdOfSqlTarget = getIdOfSqlTarget;
module.exports.getIdOfEmployee = getIdOfEmployee;
module.exports.createNameObj = createNameObj;