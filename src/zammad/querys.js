async function GetTicketsFromCorp (token, axios, org) {
    console.log("org", org);
    var res = await axios({
        url : `https://helpdesk.pg3.io/api/v1/tickets/search?query=organization.name:${encodeURI(org)}&expand=true`,
        method: 'GET',
        headers: {
            "Authorization": `Token token=${token}`,
            "Content-Type": 'application/json',
        }
    });
    if (typeof(res) === Promise)
        return res.resolve().data;
    else return res.data;
}

export {
    GetTicketsFromCorp
}