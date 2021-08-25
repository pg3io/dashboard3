async function GetTicketsFromCorp (token, axios, org) {
    var res = await axios({
        url : `https://helpdesk.pg3.io/api/v1/tickets/search?query=organization.name:${encodeURI(org)}&limit=20&expand=true`,
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

async function GetTicketsFromId (token, axios, id) {
    var res = await axios({
        url : `https://helpdesk.pg3.io/api/v1/tickets/${encodeURI(id)}`,
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

async function GetArticlesFromTicket (token, axios, id) {
    var res = await axios({
        url : `https://helpdesk.pg3.io/api/v1/ticket_articles/by_ticket/${id}`,
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
    GetTicketsFromCorp,
    GetTicketsFromId,
    GetArticlesFromTicket
}