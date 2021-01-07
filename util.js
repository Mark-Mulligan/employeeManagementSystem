function createArrayFromSqlData(sqlData, key) {
    let newArr = [];
    for (let i = 0; i < sqlData.length; i++) {
        newArr.push(sqlData[i][key]);
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

module.exports.createArrayFromSqlData = createArrayFromSqlData;
module.exports.getIdOfSqlTarget = getIdOfSqlTarget;