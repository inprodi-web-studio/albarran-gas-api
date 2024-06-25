module.exports = {
    routes : [
        {
            method : "GET",
            path : "/dispatcher/bombs",
            handler : "bomb.find",
        },
    ],
};