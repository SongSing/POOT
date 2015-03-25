var relay;
var cache = {};

function init()
{
	$(".serverList-container").show(); // show this initially, the others are hidden in the css
	relay = new Relay("server.pokemon-online.eu:10508", handleOpen, handleMessage, handleClose, handleError);
	
	$("#serverInput-back").click(function() { switchTo(".serverList-container"); });
	$("#serverInput-connect").click(function() { connectToServer(); });
}

function connectToServer()
{
	cache.name = $("#serverInput-name").get(0).value;
	cache.color = $("#serverInput-color").get(0).value;
	
	var ip = $("#serverInput-ip").get(0).value;
	ip = (ip.contains(" - ") ? ip.substr(ip.lastIndexOf(" - ") + 3) : ip);
	
	relay.send("connect", ip);
}

function handleOpen()
{
	
}

function handleMessage(msg)
{
	var text = msg.data.toString();
	var command = text.split("|")[0];
	var data = (text.contains("|") ? text.substr(text.indexOf("|") + 1) : undefined);
	//console.log(msg);
	
	if (commandHandlers.hasOwnProperty(command))
	{
		commandHandlers[command](data);
	}
}

function handleClose()
{
	alert("Connection closed. Please refresh the page. If this fails, the registry/server may be down.");
}

function handleError(data)
{
	console.log(data);
}

var commandHandlers =
{
	"defaultserver": function(data) // data is default ip
	{
		relay.send("registry"); // request registry
	},
	"servers": function(data) // json - description, ip, locked, max?, name, num, port
	{
		//console.log("making");
		var servers = JSON.parse(data);
		cache.servers = servers;
		
		var listed = [];
		var items = [];
		
		for (var i = 0; i < servers.length; i++)
		{
				var server = servers[i];
				
				if (listed.length === 0)
				{
					listed.push(server);
				}
				else
				{
						var push = true;
						
						for (var j = 0; j < listed.length; j++)
						{
								if (server.num > listed[j].num)
								{
									listed.insert(j, server);
									push = false;
									break;
								}
						}
						
						if (push)
						{
								listed.push(server);
						}
				}
		}
		
		for (var i = 0; i < listed.length; i++)
		{
			var server = listed[i];
			var item = document.createElement("div");
			item.className = "serverListItem";
			item.server = server;
			
			var name = document.createElement("div");
			name.className = "serverListItemName";
			$(name).html(escapeHTML(server.name));
			
			var num = document.createElement("div");
			num.className = "serverListItemNum";
			$(num).html(server.num + (server.hasOwnProperty("max") ? " / " + server.max : ""));
			
			$(item).append(name);
			$(item).append(num);
			$(item).click(function() { itemClicked(this); });
			items.push(item);
		}
		
		for (var i = 0; i < items.length; i++)
		{
			$(".serverList-container").append(items[i]);
		}
	},
	"connected": function(data)
	{
		var login = { version: 1 };
		login.default =  ""; //getVal("defaultChannel", "");
		login.autojoin = getVal("autojoinChannels", []);
		login.ladder = getVal("ladderEnabled", true);
		login.idle = getVal("idle", false);
		login.color = cache.color;
		login.name = cache.name;
		
		relay.send("login", login);
	},
	"challenge": function(data)
	{
		var genHash = function(pass, salt)
		{
			return md5(md5(pass) + salt);
		};
		
		var pass = $("#serverInfo-pass").get(0).value;
		
		if (pass)
		{
			relay.send("auth", { "hash": genHash(pass, data) });
		}
	},
	"login": function(data)
	{
		cache.info = JSON.parse(data);
		
		clientSwitchTo(".client-channels");
		switchTo(".client-container");
	},
	"channels": function(data)
	{
		data = JSON.parse(data);
		
		allChannels = data;
		createChannelsFromJSON(data);
	}
};

function itemClicked(item)
{
	var server = item.server;
	$("#serverName").html(escapeHTML(server.name));
	$("#serverDescription").html(server.description);
	$("#serverInput-ip").get(0).value = server.ip + ":" + server.port;
	
	switchTo(".serverInfo-container");
}

function switchTo(layer, dir)
{
	if (dir === undefined)
	{
		$(".client-content > div:visible").hide();
		$(layer).show();
	}
	else
	{
		var o = (dir === "left" ? "right" : (dir === "up" ? "down" : (dir === "right" ? "left" : "up")));
		$(".client-content > div:visible").hide("slide", { "direction": o }, function() { $(layer).show("slide", { "direction": dir }); });
	}
}

function clientSwitchTo(layer, dir)
{
	if (dir === undefined)
	{
		$(".client-container > div:visible").hide();
		$(layer).show();
	}
	else
	{
		var o = (dir === "left" ? "right" : (dir === "up" ? "down" : (dir === "right" ? "left" : "up")));
		$(".client-container > div:visible").hide("slide", { "direction": o }, function() { $(layer).show("slide", { "direction": dir }); });
	}
}