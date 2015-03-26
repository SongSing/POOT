function joinedPm(id)
{
	if (cache.myPms.contains(id))
	{
		switchToPm(id);
		return;
	}
	
	cache.myPms.push(id);
	$("#client-channels-myPms").append(pmItem(id));
	
	var item = new pmChatItem(id);
	
	$(".client-chat").append(item.container);
	cache.pmChatItems[id] = item;
	switchToPm(id);
}

function unjoinedPm(id)
{
	cache.pmChatItems[id].container.delete();
	$("#myPmItem" + id).get(0).delete();
	delete cache.pmChatItems[id];
	cache.myPms.remove(id);
	
	if (cache.myChannels.length > 0)
	{
		switchToChannel(cache.myChannels[0]);
	}
}

function pmItem(id)
{
	var d = document.createElement("li");
	d.className = "myPmItem";
	$(d).html(userName(id));
	d.id = "myPmItem" + id;
	d.uid = id;
	d.uname = userName(id);
	
	$(d).click(function()
	{
		switchToPm(id);
		clientSwitchTo(".client-chat");
	});
	
	var close = document.createElement("div");
	close.className = "myPmItem-close";
	close.innerHTML = "Leave";
	
	$(close).click(function(e)
	{
		e.stopPropagation(); // so doesnt go through
		unjoinedPm(id);
	});
	
	$(d).append(close);
	
	return d;
}

function pmChatItem(id)
{
	this.id = id;
	var self = this;
	
	var container = document.createElement("div");
	container.className = "pmItem-container";
	container.id = "pmItem-container" + id;
	
	var chat = document.createElement("div");
	chat.className = "pmItem-chat";
	chat.id = "pmItem-chat" + id;
	
	var text = document.createElement("input");
	text.type = "text";
	text.className = "form-control si pmItem-text flatbox";
	text.id = "pmItem-text" + id;
	
	var send = document.createElement("button");
	send.className = "btn btn-large btn-primary pmItem-send";
	send.id = "pmItem-send" + id;
	send.innerHTML = "Send";
	
	$(container).append(chat).append(text).append(send);
	
	this.sendText = function()
	{
		var ts = timestamp();
		
		if (!self.text.value)
		{
			return;
		}
		
		relay.send("pm", { "to": self.id, "message": self.text.value });
		
		var name = userName(cache.info.id);
		var message = escapeHTML(self.text.value);
		var src = cache.info.id;
		
		self.text.value = "";
		
		var toPrint = "<span class='chat-player' style='color:%4;'>%1 <b>%2:</b></span> %3".args(ts, name, message, user(src).color);
		printPm(toPrint, self.id);
	};
	
	this.appendChat = function(content)
	{
		$(self.chat).append(content + "<br />");
		scrollToBottom(self.chat);
	};
	
	$(send).click(self.sendText);
	
	$(text).keypress(function(e)
	{
		if (e.which === 13)
		{
			self.sendText();
		}
	});
	
	this.container = container;
	this.chat = chat;
	this.text = text;
	this.send = send;
}

function switchToPm(id)
{
	if (!cache.usersById.hasOwnProperty(id))
	{
		return;
	}
	
	if (!cache.myPms.contains(id))
	{
		joinedPm(id);
		return;
	}
	
	hideChannels();
	hidePms();
	
	$("#pmItem-container" + id).show();
	$(".nav-header").html(escapeHTML(userName(id)));
}

function hidePms()
{
	$(".pmItem-container").hide();
}

function printPm(msg, user)
{\
	if (user === -1)
	{
		console.log("user -1");
	}
	else
	{
		cache.pmChatItems[user].appendChat(msg);
	}
}