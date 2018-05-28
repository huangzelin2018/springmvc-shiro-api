/**
 * Qiu.qingbo
 * jq工具类
 */

(function( $, undefined ) {
	$.fn.extend({
		imgLoading:function (opts) {
			var obj = $(this);
			var loadingUrl = ctx+"/framework/query2/css/images/loading.gif";
			var height = obj.height();  
			var width = obj.width();
			var leftW = width/2-90;
			var topW = height/2-30;
			if(topW<0){topW=0;}
			var left = obj.position().left;
			var top = obj.position().top;
			
			 var _html = "<div id='loading' style='position:absolute;width:"+width+"px;height:"+height+
			 "px;background:#E0ECFF;opacity:0.8;z-index:99999;filter:alpha(opacity=80);'><div style='position:absolute;  cursor1:wait;left:"+leftW+
			 "px;top:"+topW+"px;width:auto;height:18px;padding:9px 5px 5px 25px;background:#fff url("+loadingUrl+")"+ 
			 " no-repeat scroll 5px 10px;border:2px solid #ccc;color:#000;font-family:微软雅黑'>正在加载，请等待...</div></div>";  
			
			
			 obj.wrap("<div></div>");
			 var _parent = obj.parent();
			 var loading = $(_html).insertBefore(obj);
			 
			 loading.stop = function(){
				 loading.remove();
				 loading = null;
				 obj.unwrap();
			 }
			 
			 return loading;
		}
		
	});
})(jQuery);

(function( $, undefined ) {
	$.extend({
		alert:function(a,b,c){
			var _title = "提示";
			var _content;
			var _callback;
			if(a){
				_content = a;
			}
			if(b){
				if(typeof b =="string"){
					_title = a;
					_content = b;
				}else if(typeof b =="function"){
					_content = a;
					_callback = b;
				}
			}
			if(c){
				if(typeof c =="function"){
					_callback = c;
				}
			}
			var maxZ = Math.max.apply(null, $.map($('body > *'), function (e, n) {
	            return parseInt($(e).css('z-index')) || 1;
	            })
	        );
			if(isNaN(maxZ)){
				maxZ = null;
			}else if(maxZ<0){
				maxZ = 9999;
			}
			var _result = false;
			var _json = {     
					dialogType:"modal",
					title: _title,
					content:_content,
					width: 300,
					zIndex:maxZ+10,
					onClose:function(){
	                	if(_callback){return _callback(_result);}
	                },
	                button:[{
	                	value:"确定",
	                	callback:function(){
	                		_result = true;
	                	},
	                	autofocus:true                
	                }]  
			};  
			return $.sbdialog(_json);
		},
		confirm:function(a,b,c){
			var _title = "提示";
			var _content;
			var _callback;
			if(a){
				_content = a;
			}
			if(b){
				if(typeof b =="string"){
					_title = a;
					_content = b;
				}else if(typeof b =="function"){
					_content = a;
					_callback = b;
				}
			}
			if(c){
				if(typeof c =="function"){
					_callback = c;
				}
			}
			var maxZ = Math.max.apply(null, $.map($('body > *'), function (e, n) {
	            return parseInt($(e).css('z-index')) || 1;
	            })
	        );
			if(isNaN(maxZ)){
				maxZ = null;
			}else if(maxZ<0){
				maxZ = 9999;
			}
			var _result = false;
			var _json = {     
					dialogType:"modal",
					title: _title,
					content:_content,
					width: 300,
	                height: 30,
	                zIndex:maxZ+10,
	                onClose:function(){
                		if(_callback){return _callback(_result);}
                	},
	                button:[{
	                	value:"确定",
	                	callback:function(){
	                		_result=true;
	                	},
	                	autofocus:true                
	                },{
	                	value:"取消",
	                	callback:function(){
	                		_result=false;
	                	}              
	                }]  
			};  
			return $.sbdialog(_json);
		},
		tips:function(a){
			var msgJson = {     
					dialogType:"message",
					width: 300,
					text: a,
					autoClose:5 //5秒后自动关闭   
			};  
			var message = $.sbdialog(msgJson);
		},
		timing:function(a,b,c,t){
			var _title = "提示";
			var _content;
			var _callback;
			var _time = 5;
			var _key = "[code]";
			if(a){
				_content = a;
			}
			if(b){
				if(typeof b =="string"){
					_title = a;
					_content = b;
				}else if(typeof b =="function"){
					_content = a;
					_callback = b;
				}else if(typeof b =="number"){
					_content = a;
					_time = b;
				}
			}
			if(c){
				if(typeof c =="function"){
					_callback = c;
				}else if(typeof c =="number"){
					_time = c;
				}
			}
			var _codeId = "timingCode_id";
			if(_content.indexOf(_key)>-1){
				_content = _content.replace(_key,"<span id='"+_codeId+"'>"+_time+"</span>");
			}
			
			var maxZ = Math.max.apply(null, $.map($('body > *'), function (e, n) {
	            return parseInt($(e).css('z-index')) || 1;
	            })
	        );
			if(isNaN(maxZ)){
				maxZ = null;
			}else if(maxZ<0){
				maxZ = 9999;
			}
			var _result = false;
			var _json = {     
					dialogType:"modal",
					title: _title,
					content:_content,
					width: 300,
					zIndex:maxZ+10,
					onClose:function(){
	                	if(_callback){return _callback(_result);}
	                }
			};  
			var _dialog = $.sbdialog(_json);
			
			var intervalid = setInterval(function(){
				if(_time==0){clearInterval(intervalid);return;};
				$("#"+_codeId).html(--_time);
			}, 1000);
			
			setTimeout(function(){
				_dialog.closeDialog();
			},_time*1000);
			return _dialog;
		},
		/**
		 * 自定义js保存对象，type目前支持两种形式：js、cookie;默认js
		 */
		hiData:function(key,value,type){
			if($.jqueryTool.isBlank(type)){
				type = "js";
			}
			var JS_KEY = "HIDATA_JS_VALUES";
			if(type=="js"){
				var topWindow = window.top.window;
				try{
					if($.jqueryTool.isBlank(topWindow[JS_KEY])){
						topWindow[JS_KEY] = {};
					}
					if($.jqueryTool.isBlank(value)){
						return topWindow[JS_KEY][key];
					}else{
						topWindow[JS_KEY][key] = value;
					}
				}catch(e){
					return $.hiData(key,value,"cookie");
				}
			}else if(type=="cookie"){
				if($.jqueryTool.isBlank(value)){
					return $.cookie(key);
				}else{
					$.cookie(key,value,{secure:true});
				}
			}else if(type=="jsClear"){
				window.name = {};
			}
			
			return value;
		},
		adamImage:function(name){
			var xOffset = 10;
			var yOffset = 30;
			var preview = null;
			var imgs = $("img[name='"+name+"']");
			imgs.hover(function(e){
	    		this.t = this.title;
	    		this.title = "";	
	    		var c = (this.t != "") ? "<br/>" + this.t : "";
	    		preview = $("<div id='preview' style='z-index:9999;position:absolute;border:1px solid #ccc;background:#333;padding:5px;display:none;color:#fff;'><img src='"+ this.src +"' alt='图片预览' width='300px' />"+ c +"</div>").appendTo($("body"));
	    		preview.css("top",(e.pageY - xOffset) + "px")
	    			.css("left",(e.pageX + yOffset) + "px")
	    			.fadeIn("fast");						
	        },
	    	function(){
	    		this.title = this.t;	
	    		preview.remove();
	        });	
			imgs.mousemove(function(e){
				preview
	    			.css("top",(e.pageY - xOffset) + "px")
	    			.css("left",(e.pageX + yOffset) + "px");
	    	});
			imgs.each(function(){
	    		$(this).wrap("<a href='"+this.src+"' target='_blank'></a>");
	    	});
	    	
		},
		jqueryTool:{
			isNotBlank:function(obj){
				if(obj===undefined||obj===null||$.trim(obj)===""){
					return false;
				}
				return true;
			},
			isBlank:function(obj){
				if(obj===undefined||obj===null||$.trim(obj)===""){
					return true;
				}
				return false;
			},
			componentSetValue:function(component,obj){
				$.sinobestComponent.components[component.getClassName()].setValue(component,obj);
			},
			string2function:function(fun){
				return eval("(function(){ return "+fun+";})()"); 
			}
		}
	});
})(jQuery);

Date.prototype.Format = function(fmt) { // author: Qiu.qingbo
	var o = {
		"M+" : this.getMonth() + 1, // 月份
		"d+" : this.getDate(), // 日
		"h+" : this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, // 小时
		"H+" : this.getHours(), // 小时
		"m+" : this.getMinutes(), // 分
		"s+" : this.getSeconds(), // 秒
		"q+" : Math.floor((this.getMonth() + 3) / 3), // 季度
		"S" : this.getMilliseconds()
	// 毫秒
	};
	var week = {
		"0" : "/u65e5",
		"1" : "/u4e00",
		"2" : "/u4e8c",
		"3" : "/u4e09",
		"4" : "/u56db",
		"5" : "/u4e94",
		"6" : "/u516d"
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "")
				.substr(4 - RegExp.$1.length));
	}
	if (/(E+)/.test(fmt)) {
		fmt = fmt
				.replace(
						RegExp.$1,
						((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f"
								: "/u5468")
								: "")
								+ week[this.getDay() + ""]);
	}
	for ( var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k])
					: (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
};

(function( $, undefined ) {
	$.extend({
		getRegex:function(a){
			switch(a)
			{
				case "mail":
					return /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
				case "telephone":
					return /^((\(\d{2,3}\))|(\d{3}\-))?(\(0\d{2,3}\)|0\d{2,3}-)?[1-9]\d{6,7}(\-\d{1,4})?$/;
				case "mobile":
					return /^1\d{10}$/;
				case "phone":
					return /^(1\d{10}|((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})))$/;
				case "post":
					return /^[0-9]\d{5}(?!\d)$/;
				default:
					return eval(a);
			}
		}
	});
})(jQuery);

$(function(){
	if($.sberror){
		$.sberror.onError = function (e) {
			$('body').html(e.responseText);
		};
	}
	if($.sbloadingstatus){
		var loadingJson = {mode:"auto"};        
		var loading = $.sbloadingstatus(loadingJson);
	}
//	$("iframe[type='page']").each(function(){
//		$(this).load(function(){
//			var id = $(this).attr('id');
//		   setTimeout(function(){
//				var ifm = $.sbiframetools.getIframeById(id);
//			   var subWeb = document.frames ? document.frames[id].document : ifm.contentDocument; 
//			   if(ifm != null && subWeb != null) {
//		     		ifm.height = subWeb.documentElement.scrollHeight;
//				   setTimeout(function(){
//					   if(subWeb.documentElement.scrollHeight==0){
//						   ifm.height = $(window).height();
//					   }else{
//						   ifm.height = subWeb.documentElement.scrollHeight;
//					   }
//				   },1000);
//			   }
//		   },1000);
//		});
//	});
});
function resizeTab(tab){
	var _height = $(window).height();
	var _nav = tab.find(".ui-tabs-nav").height();
	var _top = tab.offset().top;
	tab.height(_height-_nav-40-_top);
//	tab.find(">div>iframe").each(function(){
//		var _iframe = $(this);
//		var iframeObj = null;
//		if(_iframe.attr("id")){
//			iframeObj = $.sbiframetools.getIframeById(_iframe.attr("id"));
//		}else if(_iframe.attr("name")){
//			iframeObj = $.sbiframetools.getIframeByName(_iframe.attr("name"));
//		}
//		if(iframeObj){
//		   if(iframeObj != null) {
//			   setTimeout(function(){
//				   iframeObj.contentWindow.document.body.style.width = iframeObj.contentWindow.document.body.clientWidth-30 + "px";
//			   },1000);
//		   }
//		}
//		
//	});
}
function postNewWin(url,params){
    var iframe = document.getElementById("postData_iframe");
    if(!iframe){
        iframe = document.createElement("iframe");
        iframe.id = "postData_iframe";
        iframe.scr= "about:blank";
        iframe.frameborder = "0";
        iframe.style.width = "0px";
        iframe.style.height = "0px";
        
        var form = document.createElement("form");
        form.id = "postData_form";
        form.method = "post";
        form.target = "_blank";
        
        document.body.appendChild(iframe);
        iframe.contentWindow.document.write("<body>" + form.outerHTML + "</body>");
    }
    var _html = "";
    for(var key in params){
    	_html = _html + "<input name='"+key+"' id='"+key+"' type='text' value='" + params[key] + "'/>";
    }
    iframe.contentWindow.document.getElementById("postData_form").innerHTML = _html;
    iframe.contentWindow.document.getElementById("postData_form").action = url;
    iframe.contentWindow.document.getElementById("postData_form").submit();
    
}
/**
 * sinobest控件获取工具
 * 根据传入的id，获取当前标签下所有的sinobest控件，并已控件集合的形式返回
 */
(function( $, undefined ) {
	$.fn.extend({
		getAllComponents:function(){
			var component = this;
			var _params = {};
			for(var i in $.sinobestComponent.components){
				_params = $.extend({}, _params, $.sinobestComponent.components[i].getComponents(component));
			}
			return _params;
		},
		getComponentById:function(id){
			var component = this;
			var parentName = this.attr("parent_name");
			if($.jqueryTool.isNotBlank(parentName)){
				id = id + parentName;
			}
			var _params = null;
			var comp = component.find("#"+id);
			if(comp.length>0){
				for(var i in $.sinobestComponent.components){
					_params = $.sinobestComponent.components[i].getComponentById(comp);
					if(null!=_params){
						return _params;
					}
				}
			}
			return _params;
		}
	});
	$.extend({sinobestComponent:{}});
	$.extend($.sinobestComponent, {
		components:{
			"sinobest-hidden":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-hidden").each(function(){
						var comp = $(this).sbhidden();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-hidden")){
						return comp.sbhidden();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-text":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-text").each(function(){
						var comp = $(this).sbtext();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-text")){
						return comp.sbtext();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-numbertext":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-numbertext").each(function(){
						var comp = $(this).sbnumbertext();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-numbertext")){
						return comp.sbnumbertext();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-date":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-date").each(function(){
						var comp = $(this).sbdate();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-date")){
						return comp.sbdate();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-daterange":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-daterange").each(function(){
						var comp = $(this).sbdaterange();
						if(comp){
							//因为有两个name
							params[comp.getName()[0]] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-daterange")){
						return comp.sbdaterange();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-textarea":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-textarea").each(function(){
						var comp = $(this).sbtextarea();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-textarea")){
						return comp.sbtextarea();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-checkbox":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-checkbox").each(function(){
						var comp = $(this).sbcheckbox();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-checkbox")){
						return comp.sbcheckbox();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(eval("("+value+")"));
				}
			},
			"sinobest-radio":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-radio").each(function(){
						var comp = $(this).sbradio();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-radio")){
						return comp.sbradio();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-password":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-password").each(function(){
						var comp = $(this).sbpassword();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-password")){
						return comp.sbpassword();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-select":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-select").each(function(){
						var comp = $(this).sbselect();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-select")){
						return comp.sbselect();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			},
			"sinobest-bigselect":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-bigselect").each(function(){
						var comp = $(this).sbbigselect();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-bigselect")){
						return comp.sbbigselect();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(eval("("+value+")"));
				}
			},
			"sinobest-tree":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-tree").each(function(){
						var comp = $(this).sbtree();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-tree")){
						return comp.sbtree();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(eval("("+value+")"));
				}
			},
			"sinobest-listbox":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-listbox").each(function(){
						var comp = $(this).sblistbox();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-listbox")){
						return comp.sblistbox();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(eval("("+value+")"));
				}
			},
			"sinobest-personselect":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-personselect").each(function(){
						var comp = $(this).sbpersonselect();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-personselect")){
						return comp.sbpersonselect();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(eval("("+value+")"));
				}
			},
			"sinobest-areaselect":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-areaselect").each(function(){
						var comp = $(this).sbareaselect();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-areaselect")){
						return comp.sbareaselect();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(eval("("+value+")"));
				}
			},
			"sinobest-baseareaselect":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-baseareaselect").each(function(){
						var comp = $(this).sbbaseareaselect();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-baseareaselect")){
						return comp.sbbaseareaselect();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(eval("("+value+")"));
				}
			},
			"sinobest-commonselect":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-commonselect").each(function(){
						var comp = $(this).sbcommonselect();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-commonselect")){
						return comp.sbcommonselect();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(eval("("+value+")"));
				}
			},
			"sinobest-richtexteditor":{
				getComponents:function(obj){
					var params = {};
					obj.find(".sinobest-richtexteditor").each(function(){
						var comp = $(this).sbrichtexteditor();
						if(comp){
							params[comp.getName()] = comp;
						}
					});
					return params;
				},
				getComponentById:function(comp){
					if(comp.hasClass("sinobest-richtexteditor")){
						return comp.sbrichtexteditor();
					}
					return null;
				},
				setValue:function(comp,value){
					comp.setValue(value);
				}
			}
		}
	});
})(jQuery);

(function($){  
    //备份jquery的ajax方法  
    var _ajax=$.ajax;  
      
    //重写jquery的ajax方法  
    $.ajax=function(opt){  
    	if(null!=window['reqParam']){
    		if(opt.url.indexOf("?")>-1){
    			opt.url=opt.url +"&";
    		}else{
    			opt.url=opt.url +"?";
    		}
    		opt.url=opt.url +"REQUEST_HIDDEN_PARAMS="+ JSON.stringify(reqParam);
    	}
        return _ajax(opt);  
    };  
})(jQuery);  


