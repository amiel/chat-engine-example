/*
 * chat.js
 * Amiel Martin
 * 2009-02-26
 *
 * requires: jquery.js, auto_scroll.js
 */


Chat = function(nick, user_list_hash){
	this.nick = nick;
	this.auto_scroll = new AutoScroll('#chat #messages');
	this.user_list_hash = user_list_hash;
};

jQuery.extend(Chat, {
	
	/* Globals */
	MAX_HISTORY: 500,
	MESSAGE_POLL_INTERVAL: 2.5 * 1000,
	INACTIVITY_TIMEOUT: 30 * 60 * 1000,
		
	instance: null, /* holder for Chat instance. */
	
	/* Class methods */
	
	setup_nick_form: function(){		
		$('#nick_form').submit(function(){
			return Chat.form_submit_handler(this);
		});
	},
	
	setup_message_form: function(){
		$('#message').focus();
		$('#message_form').submit(function(){
			// don't submit anything unless the first text field contains some content
			var first_text_value = $(this).find(':text').val();
			if (!(/[\w\?]/.test(first_text_value))) return false;
			
			Chat.form_submit_handler(this);
			Chat.show_activity('#message');
			$('#message').val('');
			Chat.instance.restart_inactivity_timer();
			return false;
		});
	},


	form_submit_handler: function(form){
		var $form = $(form);
		$form.find(':submit').attr('disabled', 'disabled');
		
		var ajax_options = $.extend({}, {
			async: true,
			data: $.param($form.serializeArray()),
			dataType: 'script',
			type: $form.find('[name=_method]').val() || $form.attr('method'),
			url: $form.attr('action')
		});

		var request = $.ajax(ajax_options);
		return false;
	},

	// this is here for convenience
	externalize_links: function(selector) {
		$(selector || document).find("a[rel=external]").click(function(){
			window.open(this.href);
			return false;
		}).attr("rel", "externalized");
	},

	show_activity: function(selector){
		$(selector).addClass('loading');
	},

	hide_activity: function(selector){
		$(selector).removeClass('loading');
	},
	
	leave_room: function(){
		if(Chat.instance) Chat.instance.leave_room(false);	
	},


	/* instance methods */

	prototype: {
		
		get_messages: function(callback){
			$.getScript('/chats/' + this.nick + '.js', callback);
		},
		
		update_messages: function(messages){
			var current_nick = this.nick; // bring into local scope for $.each
			this.auto_scroll.before_update();

			$.each(messages, function(i, e){
				var user = $('<span class="user"></span>').html(e.nick + ':'),
					content = $('<span class="message"></span>').html(e.content),
					message = $('<li></li>').append(user).append(content),
					me_re_string = "\\b" + current_nick.replace(/(_+)$/, "($1)?") + "\\b",
					me_re = new RegExp(me_re_string, "i");
				
				if (e.nick == current_nick) message.addClass('me');
				if (me_re.test(e.content)) message.addClass('mentioned');
				Chat.externalize_links(message);
				
				$('#chat #messages').append(message);
			});
			this.auto_scroll.after_update();
			this.limit_history();
		},
		

		check_user_list: function(hash){
			if (this.user_list_hash != hash) this.get_new_user_list();
		},
		
		limit_history: function(){
			var message_count = $('#chat #messages li').length;
			if (message_count > Chat.MAX_HISTORY)
				$('#chat #messages li:lt(' + (message_count - Chat.MAX_HISTORY) + ')').remove();
		},
		
		get_new_user_list: function(){
			$.getScript('/chats/user_list.js');
		},
		
		update_users: function(users){
			$('#user_count span').html(users.length);
			var $u = $('#users ul');
			$u.empty();
			$.each(users, function(i,u){
				$u.append('<li>' + u + '</li>');
			});			
		},
		
		show_overlay: function(){
			$('#chat').remove();
			var overlay = $('#chat_overlay').show();
			overlay.find('#nick_form :submit').removeAttr('disabled');
			overlay.find('#nick').val(this.nick).focus();
			overlay.find('#nick_errors').hide();
			return overlay;
		},
		
		show_inactivity_overlay: function(){
			this.show_overlay()
				.find('#choose_nickname').hide().parent()
				.find('#inactivity_notice').show();
		},
		
		start_polling: function(){
			// make sure there is no timer running now
			clearInterval(this.poll_timer);
			
			this.poll_timer = setInterval(this.bind(function(){
				this.get_messages();
			}), Chat.MESSAGE_POLL_INTERVAL);
		},
		
		stop_polling: function(){
			clearInterval(this.poll_timer);
		},
		
		leave_room: function(with_overlay){
			this.stop_polling();
			this.unregister_nick();
			this.stop_inactivity_timer();
			if (typeof(with_overlay) != 'undefined' && with_overlay) {
				this.show_overlay()
					.find('#inactivity_notice').hide().parent()
					.find('#choose_nickname').text('You have left the chat.').show();
			}
		},
		
		restart_inactivity_timer: function(){
			this.stop_inactivity_timer();
			this.start_inactivity_timer();
		},
		
		start_inactivity_timer: function(){
			this.inactivity_timer = setTimeout(this.bind(function(){
				this.leave_room(false);
				this.show_inactivity_overlay();
			}), Chat.INACTIVITY_TIMEOUT);
		},
		
		stop_inactivity_timer: function(){
			clearTimeout(this.inactivity_timer);
		},
		
		unregister_nick: function(){
			$.ajax({
				async: true,
				data: { authenticity_token: $('input[name=authenticity_token]').val() },
				dataType: 'script',
				type: 'delete',
				url: '/chats/' + this.nick + '.js'
			});
		},
		
		bind: function() {
	            var _func = arguments[0] || null,
	            	_obj = arguments[1] || this,
	            	_args = $.grep(arguments, function(v, i) {
	                    return i > 1;
	            });

	            return function() {
	                    return _func.apply(_obj, _args);
	            };
	    }
	}
});

Chat.ajax_callbacks = {
	create: function(nick, user_hash, chat_html){
		$("#nick_form").find(":submit").removeAttr("disabled");
		$('#chat_overlay').hide().after(chat_html);
		Chat.setup_message_form();

		Chat.instance = new Chat(nick, user_hash);
		Chat.instance.start_polling();
		Chat.instance.start_inactivity_timer();
	},
	
	create_error: function(error_text){
		clearTimeout(Chat.ajax_callbacks.error_fade_timer);
		$("#nick_errors").show().html(error_text);
		$("#nick_form").find(":submit").removeAttr("disabled");
		Chat.ajax_callbacks.error_fade_timer = setTimeout(function(){
			$('#nick_errors').fadeOut();
		}, 3 * 1000);
	},
	
	show: function(messages, user_hash){
		Chat.instance.update_messages(messages);
		Chat.instance.check_user_list(user_hash);
	},
	
	user_list: function(users, user_hash){
		Chat.instance.update_users(users);
		Chat.instance.user_list_hash = user_hash;
	},
	
	update: function(){
		$('#message_form :submit').removeAttr('disabled');
		Chat.instance.get_messages(function(){
			Chat.hide_activity('#message');
		});
	},
	
	destroy: function(){}
};

$(document).ready(function() {
	Chat.setup_nick_form();
});


$(window).unload(function(){
	Chat.leave_room();
});
