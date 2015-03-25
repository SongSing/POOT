var parsers =
{
	"connect": function(data)
	{
		return "connect|" + data.toString();
	},
	"login": function(data)
	{
		return "login|" + JSON.stringify(data);
	},
	"registry": function(data)
	{
		return "registry";
	},
	"auth": function(data)
	{
		return "auth|" + data.hash;
	},
	"chat": function(data)
	{
		return "chat|" + JSON.stringify(data);
	},
	"join": function(data)
	{
		return "join|" + data.toString();
	},
	"leave": function(data)
	{
		return "leave|" + data.toString();
	},
	"pm": function(data)
	{
		return "pm|" + JSON.stringify(data);
	}
};

function Relay(ip, openfn, messagefn, closefn, errorfn)
{
	this.socket = new WebSocket("ws://" + ip);
	
	this.socket.onopen = openfn;
	this.socket.onmessage = messagefn;
	this.socket.onclose = closefn;
	this.socket.onerror = errorfn;
}

Relay.prototype.sendRaw = function(raw)
{
	//console.log("Sending: " + raw);
	this.socket.send(raw);
};

Relay.prototype.command = Relay.prototype.send = function(cmd, data)
{
	this.sendRaw(parsers[cmd](data));
};

Relay.prototype.close = function()
{
	this.socket.close();
};