var relay;
var cache = {};

function init()
{
	$(".serverList-container").show(); // show this initially, the others are hidden in the css
	relay = new Relay("server.pokemon-online.eu:10508", handleOpen, handleMessage, handleClose, handleError);
}

function handleOpen()
{
	
}

function handleMessage(msg)
{
	var text = msg.data.toString();
	var command = text.split("|")[0];
	var data = (text.contains("|") ? text.substr(text.indexOf("|") + 1) : undefined);
	
	if (commandHandlers.hasOwnProperty(command))
	{
		commandHandlers[command](data);
	}
}

function handleClose()
{
	
}

function handleError()
{
	
}

var commandHandlers =
{
	"defaultserver": function(data) // data is default ip
	{
		relay.send("registry"); // request registry
	},
	"servers": function(data) // json - description, ip, locked, max?, name, num, port
	{
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
			items.push(item);
		}
		
		for (var i = 0; i < items.length; i++)
		{
			$(".serverList-container").append(items[i]);
		}
	}
};


