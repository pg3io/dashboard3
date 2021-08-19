async function GetTicketsFromCorp (token, axios) {
    var res;
    console.log('token: ' + token);
    axios( {
        url : 'https://helpdesk.pg3.io/api/v1/tickets',
        method: 'GET'
    });
    axios( {
            url : 'https://helpdesk.pg3.io/api/v1/tickets',
            method: 'GET',
            headers: {
            "Authorization": `Token token=${token}`,
            "Content-Type": 'application/json',
        }
    }).then((response) => {
        console.log(response);
        res = response.data;
    });
    console.log(res);
    return res;
}

export {
    GetTicketsFromCorp
}