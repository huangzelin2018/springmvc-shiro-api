/**
 * Sinobest-Areaselect:地区选择组件
 * 
 * Dependency:jquery.placeholder.js,sinobest-tools.js
 */
(function ($) {
    var defaults = {
        name:null,
        className: "sinobest-areaselect",
        required: false,
        placeholder: null,
        disabled: false,
        readonly: false,
        callback: null,
        data: null, 
        url: null, 
        rootId: null,
        level: 3,
        value: null,
        beforeSend: null,
        complete: null,
        valueField: "code",
        labelField: "detail",
        delimiter:null,
        saveType:"c",
        otherRequestParam:null,
        labelDelimiter:";",
        parentField:"pId",
        zIndex:null,
        onChange:null,
        editable:false,
        mode:"all",     //all:全选模式    branch:树枝模式
        transUrl:null,
        onTranslateRequest:null,
        onTranslateResponse:null,
        onInitComplete:null,
        defaultValue:null,
        canNotModifyLevel:null,
        setValueTriggerChange:true
    };

    $.fn.sbareaselect = function (options) {
        var settings;
        var $areaselect = this;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }

        $areaselect.settings = settings;

        function getter() {
            return $areaselect.data("$areaselect");
        }

        function setter() {
            $areaselect.data("$areaselect", $areaselect);
        }

        function isContain() {
            return $areaselect.data("$areaselect");
        }

        $.sbbase.mixinWidget($areaselect);
        
        /**
         * Get text value
         * @return  object
         */
        $areaselect.getValue = function () {
        	return getSelectedValues($areaselect.settings.saveType);
        };
        
        /**
         * 获取选择的值通过类型参数
         * @param  type:c 编码  d:明细
         */
        function getSelectedValues(type, isGetAllValue){
            var selectedItems = $areaselect.selectedItems;
            var values = [];
        	if(selectedItems != undefined){
        		if(type == "c"){
            		for(var i = 0, length = selectedItems.length; i < length; i++){
            			values.push(selectedItems[i][$areaselect.settings.valueField]);
            		}
            	}else{
            		for(var j = 0, jlength = selectedItems.length; j < jlength; j++){
            			values.push(selectedItems[j][$areaselect.settings.labelField]);
            		}
            	}
        	}
        	
        	//处理不同mode配置的返回值
        	var newValues = [];
        	if($areaselect.settings.mode === "all" || isGetAllValue){
        		newValues = values;
        	}else{
        		var begin = values.length - 1;
        		for(; begin < values.length; begin++){
        			newValues.push(values[begin]);
        		}
        	}
        	
        	if($areaselect.settings.delimiter){
        		return newValues.join($areaselect.settings.delimiter);
        	}
        	return newValues;
        }
        
        $areaselect.getLabel = function(){
        	return getSelectedValues("d");
        };
        
        /**
         * Set text value
         * @param value new value
         * @return object
         */
        $areaselect.setValue = function (value) {
        	doSetValue(value, function(){
        		triggerChangeWhenSetValue();
        	});
        };
        
        function triggerChangeWhenSetValue(){
        	if($areaselect.settings.setValueTriggerChange){
    			triggerChange($areaselect.getSelectItems());
    		}
        }
        
        function triggerChange(selectItems){
        	if($.isFunction($areaselect.settings.onChange)){
        		$areaselect.settings.onChange.apply($areaselect, [selectItems]);
           }
        }
        
        function doSetValue(value, completeCallBack, isDefaultValue){
        	$areaselect.valueHolder.addBase2(value, completeCallBack, (isDefaultValue || false));
        	if($areaselect.valueHolder.isProcessState()){
        		return;
        	}
        	doActualSetValue(value, completeCallBack, isDefaultValue);
        }
        
        function doActualSetValue(value, completeCallBack, isDefaultValue){
        	//当设置的值为空,且存在默认值,且canNotModifyLevel存在,则需要设置默认值
        	if($.sbtools.isBlank(value) && $.sbtools.isNotBlank($areaselect.settings.defaultValue)
        			&& hasCanNotModifyLevelConfig()){
        		value = $areaselect.settings.defaultValue;
        		isDefaultValue = true;
        	}
        	
        	//清空值
            $areaselect.find("a.selected").removeClass('selected');
            $areaselect.selectedItems = [];
            $areaselect.$input.val("");
           	$areaselect.settings.value = value;
           	
            if($.sbtools.isNotBlank(value)){
            	var convertvalue = $.sbtools.convertSetValue(value);
            	if($areaselect.settings.mode === "all" || isDefaultValue){
            		processSetValue(convertvalue);
            	}else{
            		translate(convertvalue, function(resData, currentCodeValue){
                        resData = resData.concat(currentCodeValue);
                	    var newConvertvalue = "";
                	    if($areaselect.settings.delimiter){
                	    	newConvertvalue = resData.join($areaselect.settings.delimiter);
                	    }else{
                	    	newConvertvalue = $.sbtools.convertSetValue(resData);
                	    }
                	    processSetValue(newConvertvalue);
                    });
            	}
            } else {
            	$areaselect.valueHolder.remove();
                if(completeCallBack && $.isFunction(completeCallBack)){
    		    	completeCallBack();
            	}
            }
        }
        
        function processSetValue(convertvalue){
        	$areaselect.valueHolder.setVal($.sbbase.ValueHolder.CONSTANTS.CONVERT_VAL_KEY, convertvalue);
            if($.isArray(convertvalue)){
        		processArrayValueWhenSetValue(convertvalue);
        	}else{
            	if(!$areaselect.isBuilded) {
            		doBuildDropdown();
                }else{
                	process$TempAnd$ProxyIfBuilded();
                }
        	}
        }
        
        function processArrayValueWhenSetValue(value){
            var inputValue = "";
    		var items = [];
        	for(var i = 0; i < value.length; i++){
        		var item = {};
        		item[$areaselect.settings.valueField] = value[i][$areaselect.settings.valueField];
        		item[$areaselect.settings.labelField] = value[i][$areaselect.settings.labelField];
        		items.push(item);
        		
        		inputValue = inputValue + value[i][$areaselect.settings.labelField];
        		if(i != value.length - 1){
        			inputValue += $areaselect.settings.labelDelimiter;
        		}
        	}
        	$areaselect.selectedItems = items;
        	$areaselect.$input.val(inputValue);
        	
        	process$TempAnd$ProxyIfBuilded();
        }
        
        function process$TempAnd$ProxyIfBuilded(){
        	if($areaselect.isBuilded) {
            	process$Temp(true);
            	process$Proxy(0, $areaselect.settings.level - 1);
            }
        }
        
        function translate(value, callback){
        	//value的值有可能是数组对象
        	if($.isArray(value) && value.length > 0){
        		if($areaselect.settings.saveType === "c"){
        			value = value[0][$areaselect.settings.valueField];
        		}else{
        			value = value[0][$areaselect.settings.labelField];
        		}
        	}
     
        	if($areaselect.settings.data){
        		return callback(translateInData(value), value);
        	}
        	
        	if(!$areaselect.settings.transUrl){
        		return callback([], value);
        	}
        	
        	var postData = {
        		"value":value,
        		"saveType":$areaselect.settings.saveType,
        		"level":$areaselect.settings.level
        	};
        	
        	$.extend(postData, $areaselect.settings.otherRequestParam || {});
     	    
        	if($areaselect.settings.onTranslateRequest && $.isFunction($areaselect.settings.onTranslateRequest)){
				 postData = ($areaselect.settings.onTranslateRequest)(postData);
			}
      	
        	$.ajax({
				type : "post",
				contentType : "application/json; charset=utf-8",
				dataType : "json",
				data : JSON.stringify(postData),
				url : $areaselect.settings.transUrl,
				success : function(dataResponse) {
                	if($areaselect.settings.onTranslateResponse && $.isFunction($areaselect.settings.onTranslateResponse)){
           				($areaselect.settings.onTranslateResponse)(dataResponse);
           			}
                    callback(dataResponse, value);
				},
				error : function(XMLHttpRequest, textStatus, errorThrown) {
					var e = new Object();
					e.code = XMLHttpRequest.status;
					e.msg = $.sberror.format(e.code, this.url);
					$.sberror.onError(e);
				}
			});
        }
        
        /**
         * 本地数组的转换,返回当前value的所有父类的id的数组,不存在则返回[].
         */
        function translateInData(value){
        	var findFiled = $areaselect.settings.saveType === "c" 
        		            ? $areaselect.settings.valueField : $areaselect.settings.labelField;
        	
            //找到自身
        	var foundItem = null;
        	for(var i = 0; i < $areaselect.settings.data.length; i++){
        		var item = $areaselect.settings.data[i];
        		if(item[findFiled] === value){
        			foundItem = item;
        			break;
        		}
        	}
        	
        	if(foundItem === null){
        		return [];
        	}
        	
        	var parentIds = [];
            if($areaselect.settings.level !== 1){
            	var parentId = foundItem[$areaselect.settings.parentField];
            	parentIds.push(parentId);
            	
            	//找到当前值的父类
            	for(var pi = 0; pi < $areaselect.settings.level - 1; pi++){
            		var currentItem = getItemFormData(parentId);
            		if(currentItem == null || 
            				currentItem[$areaselect.settings.parentField] === $areaselect.settings.rootId){
            			break;
            		}else{
            			parentId = currentItem[$areaselect.settings.parentField];
            			parentIds.push(parentId);
            		}
            	}
            	
            	//数组倒序,按照父类的先后顺序返回
            	parentIds.reverse();
            }
            
        	return parentIds;
        }
        
        function getItemFormData(id){
        	for(var i = 0; i < $areaselect.settings.data.length; i++){
        		var item = $areaselect.settings.data[i];
        		
        		if(item[$areaselect.settings.valueField] === id){
        			return item;
        		}
        	}
        	return null;
        }
        
        /**
         * Set text new state
         * @param stateJson state json
         * @return  object
         */
        $areaselect.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
                if (v !== undefined && v !== null) {
                    if (k == 'value') {
                        $areaselect.setValue(v);
                    } else if (k == 'required') {
                        $areaselect.settings.required = v;
                        $areaselect.$input.attr('required', $areaselect.settings.required);
                    } else if (k == 'readonly') {
                        $areaselect.settings.readonly = v;
                        $areaselect.$input.attr('readonly', $areaselect.settings.readonly);
                        $.sbtools.toggleInputReadonlyClass($areaselect.$input, v);
                        setEditable();
                    } else if (k == 'disabled') {
                        $areaselect.settings.disabled = v;
                        $areaselect.$input.attr('disabled', $areaselect.settings.disabled);
                        $.sbtools.toggleInputDisabledClass($areaselect.$input, v);
                    } else if(k == 'canNotModifyLevel'){
                    	$areaselect.settings.canNotModifyLevel = v;
                    	canNotModifyLevel();
                    }else {
                        $areaselect.attr(k, v);
                    }
                } else {
                    $areaselect.removeAttr(k);
                }
            });
            return $areaselect;
        };
		
        $areaselect.getDefaultOptions = function(){
        	return defaults;
        };
		
        /**
         * Reload text
         * @return object
         */
        $areaselect.reload = function () {
        	$areaselect.empty();
        	$areaselect.isBuilded = false;
        	$.sbtools.initController.removeInitCompleteFlag($areaselect, "$sbareaselect");
            return render();
        };
        
        $areaselect.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		
        		$areaselect.settings.data= null;
        		$areaselect.settings.url = null;
       		    if($.isArray(dataSource)){
       		    	$areaselect.settings.data = dataSource;
       		    }else{
       		    	$areaselect.settings.url = dataSource;
       		    }
       		    $areaselect.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };
        
        /**
         * Validate input
         */
        $areaselect.validate = function () {
            var isFunc = $.isFunction($areaselect.settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                // basic validate
                var isOk = false;
                if ($areaselect.settings.required) {
                	var v = getSelectedValues($areaselect.settings.saveType, true);
                    
                    isOk = $.sbvalidator.required($areaselect.$input[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }

                return ""; //验证通过
            }
        };

        $areaselect.getName = function(){
        	return $areaselect.settings.name;
        };
        
        $areaselect.getSelectItems = function(){
        	var selectedItems = $areaselect.selectedItems;
        	if(selectedItems === undefined || selectedItems === null || selectedItems.length <= 0){
        		return [];
        	}
        	
        	var selectItems = [];
        	for(var i = 0; i < selectedItems.length; i++){
        		var data = selectedItems[i];
        		if(data[$.sbtools.CONSTANTS.DATA_SBITEM_KEY]){
        			selectItems.push(data[$.sbtools.CONSTANTS.DATA_SBITEM_KEY]);
        		}else{
        			selectItems.push("");
        		}
        	}
        	
        	var newValues = [];
        	if($areaselect.settings.mode === "all"){
        		newValues = selectItems;
        	}else{
        		var begin = selectItems.length - 1;
        		for(; begin < selectItems.length; begin++){
        			newValues.push(selectItems[begin]);
        		}
        	}
        	return newValues;
        };
        
        function initComplete(){
        	$.sbtools.initController.initComplete($areaselect, "$sbareaselect", function(){
        		if(!isContain()){
            		setter();
            	}
        	}, $areaselect.settings.onInitComplete);
        }

        /**
         * Init
         */
        function render() {
            $areaselect.addClass($areaselect.settings.className);
            $areaselect.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            $areaselect.addClass("sinob-widget-container");
            
            $areaselect.valueHolder = new $.sbbase.ValueHolder();
            buildInput();
            
            $areaselect.$input.attr('required', $areaselect.settings.required);
            
            if ($areaselect.settings.placeholder) {
                $areaselect.$input.attr('placeholder', $areaselect.settings.placeholder);
                // 测试是否支持
                if (!$.sbtools.isPlaceHolderSupported()) {
                    $areaselect.$input.placeholder();
                }
            }
            
            $areaselect.$input.attr('readonly', $areaselect.settings.readonly);
            $.sbtools.toggleInputReadonlyClass($areaselect.$input, $areaselect.settings.readonly);
            
            $areaselect.$input.attr('disabled', $areaselect.settings.disabled);
            $.sbtools.toggleInputDisabledClass($areaselect.$input, $areaselect.settings.disabled);
            
            setEditable();
            
            // event listener
            $areaselect.$input.on('click', function () {
            	if($areaselect.settings.readonly){
        			 return;
        		}
        		 
        		if($areaselect.$dropdown != undefined && $areaselect.$dropdown.is(":visible")){
					return;
				}
        		
                // build or not
                if (!$areaselect.isBuilded) {
                	doBuildDropdown();
                }
                showDropdown();
            });
            
            if($areaselect.settings.value !== null && $areaselect.settings.value !== undefined) {
            	doSetValue($areaselect.settings.value, function(){
            		initComplete();
            		triggerChangeWhenSetValue();
            	});
            }else{
            	if($areaselect.settings.defaultValue !== null && $areaselect.settings.defaultValue !== undefined){
            		doSetValue($areaselect.settings.defaultValue, function(){
                		initComplete();
                		triggerChangeWhenSetValue();
                	}, true);
            	}else{
            		initComplete();
            	}
            }

            setter();
            return $areaselect;
        }

        /**
         * Build input
         */
        function buildInput() {
            $areaselect.$input = $('<input type="text" class="'+$.sbtools.CONSTANTS.UICLASS.TEXT_COMMON +' areaselect-input"></input>');
            if ($areaselect.settings.name) {
            	$areaselect.$input.attr("name", $areaselect.settings.name);
			}
            $areaselect.append($areaselect.$input);
        }
        
        /**
         * 文本框是否可编辑用readonly实现，需要考虑和本身设置readonly的兼容
         */
        function setEditable(){
        	if(!$areaselect.settings.editable){
                $areaselect.$input.attr('readonly', true);
            }
        }
        
        function showDropdown(){
        	$areaselect.$dropdown.show();
        	adjustDropDownContentTabWidth();
            adjustContainerPosition();
        }
        
        /**
         * IE6下面css无法控制宽度自动
         */
        function adjustDropDownContentTabWidth(){
        	if($.sbtools.isIE6()){
        	   var $tabHeader = $areaselect.$dropdownTabs.find("ul.dropdown-content-tab");
        	   
        	   var width = 0;
        	   $tabHeader.children("li").each(function(){
   				  width += $(this).outerWidth(true);
   			   });
   			   //加50是因为算出的宽度太小，无法一行显示所有的内容
   			   width += $tabHeader.children("a.clear-all-btn").outerWidth(true) + 50;
   			   //450是sinobest.areaselect.css中配置的容器初始化宽度
   			   width = width > 450 ? width : 450;
   			   $tabHeader.width(width);
        	}
        }
        
        function adjustContainerPosition(){
            //修复IE7下到获取宽度不正确的问题
			 if($.sbtools.isIE7()){
				  //设置left为0是为了获取弹出容器实际的宽度
				  $areaselect.$dropdownContent.css({"left":"0px"});
				  $areaselect.width();
			 }
       	     $.sbtools.adjustInputPopupDropdownContainerPosition($areaselect.$input, $areaselect.$dropdownContent);
		}
		
        function doBuildDropdown(){
            buildDropdown();
            afterBuildDropdown();
            $areaselect.isBuilded = true;
        }
        
        /**
         * Build area dropdown content
         */
        function buildDropdown() {
            // validate data
            var maxLevel = 1;
            $.each(($areaselect.settings.data || {}), function (idx) {
                var level = $(this).attr('level');
                maxLevel = Math.max(maxLevel, level);
            });
            $areaselect.settings.level = Math.max($areaselect.settings.level, maxLevel);

            $areaselect.$dropdown = $('<span class="areaselect-dropdown"></span>');
            $areaselect.$dropdownContent = $('<div class="areaselect-dropdown-content"></div>');
            if($areaselect.settings.zIndex){
            	$areaselect.$dropdownContent.css("z-index", $areaselect.settings.zIndex);
            }
            $areaselect.$dropdownTabs = $('<div class="dropdown-content-tabs"></div>');

            // build tabs-header
            var $tabHeader = $('<ul class="dropdown-content-tab"></ul>');
            for (var i = 0; i < $areaselect.settings.level; i++) {
                var $li = $('<li data-index="' + i + '"><a href="javascript:void(0);"><em>请选择</em><i></i></a></li>');
                $tabHeader.append($li);
            }
            // clearAll link
            //$tabHeader.append('<input type="button" class="clear-all-btn" value="清空">');
            $tabHeader.append('<a href="javascript:void(0);" class="clear-all-btn">清空</a>');
            $areaselect.$dropdownTabs.append($tabHeader);

            buildTabContent();

            // add tabs
            $areaselect.$dropdownContent.append($areaselect.$dropdownTabs);
            // add close btn
            $areaselect.$dropdownContent.append('<div class="areaselect-dropdown-close"></div>');
            // final
            $areaselect.$dropdown.append($areaselect.$dropdownContent);
            $areaselect.append($areaselect.$dropdown);
        }

        /**
         * 构建Tab内容,两种，一种是同步模式，直接读取settings.data；另一种是异步，通过ajax回调刷新构建
         */
        function buildTabContent() {
            if ($areaselect.settings.data) {
                buildTabContentFrom($areaselect.settings.data);
            } else {
                var postData = {"pid": $areaselect.settings.rootId};
                asynLoad(postData, function (json) {
                    buildTabContentFrom(json);
                }, new Array());
            }
        }
        
        /**
         * 根据Json数据来构建内容
         * @param json
         */
        function buildTabContentFrom(json) {
            for (var i = 0; i < $areaselect.settings.level; i++) {
                var $body = $('<div class="tab-content" data-area="' + i + '"><ul class="area-list-content"></ul></div>');
                if (i == 0) {
                	buildAreaList(i, $areaselect.settings.rootId, json, $body.find('ul.area-list-content'));
                }
                $areaselect.$dropdownTabs.append($body);
            }
            process$Temp(true);
        }
        
        /**
         * Build Area-list content
         * @param level which level
         * @param rootId
         * @returns {string}
         */
        function buildAreaList(level, rootId, json, $container) {
            var data;
            if ($areaselect.settings.data) {
                data = getDataByParent(rootId, $areaselect.settings.data);
            } else {
                // ajax has already load first level data
                data = json;
            }
            $container.html("");
            for(var i = 0; i < data.length; i++){
            	  var item = data[i];
                  var $item = $('<a href="javascript:void(0);"></a>');
                  $item.attr("data-value", item[$areaselect.settings.valueField]);
                  $item.text(item[$areaselect.settings.labelField]);
                  $item.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, item);
                  
                  var $li = $("<li></li>");
                  $li.append($item);
                  //最后一层不显示 next-level
                  if (level + 1 < $areaselect.settings.level) {
                      $li.append('<div class="next-level"></div>');
                  } 
                  $container.append($li);
            }
        }

        /**
         * @param silent 是否不触发onchange事件
         */
        function process$Temp(silent){
        	 if($areaselect.valueHolder.hasValue()) {
                   var array = getConvertValueArray();
                   //$areaselect.settings.level
                   for (var i = 0; i < array.length; i++) {
                       var item = array[i];
                       var length = $areaselect.find('.tab-content[data-area=' + i + '] a').length;
                       
                       if($areaselect.settings.url && i != 0){
                    	   length = 0;
                       }
                       if (length) {
                    	   if(i < array.length - 1){
                    		   proxyClick(i, item);
                    	   }else{
                    		   proxySelect(i, item, silent);
                    	   }
                       } else {
                           // proxy click  $areaselect.settings.level - 1
                    	   var proxyData = {};
                    	   proxyData.i = i;
                    	   proxyData.item = item;
                           if (i < array.length - 1) {
                        	   proxyData.method = "proxyClick";
                           } else {
                        	   proxyData.method = "proxySelect";
                        	   proxyData.silent = silent;
                           }
                           $areaselect.data('$proxy' + i,  proxyData);
                       }
                   }
              }
        }
        
        /**
         * 注：原始设置到ValueHolder中的convertValue的值类型为:对象数组/字符串
         */
        function getConvertValueArray(){
        	   var convertvalue = $areaselect.valueHolder.getConvertVal();
        	   var array = [];
        	   if($.isArray(convertvalue)){
        		 for(var i = 0; i < convertvalue.length; i++){
        			array.push(convertvalue[i][$areaselect.settings.valueField]);
        		 }
        	   }else{
        		  if($areaselect.settings.delimiter){
        			 array = convertvalue.split($areaselect.settings.delimiter);
        		  }else{
        			 array = convertvalue.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER);
        		  }
        	   }
        	   return array;
        }
        
        /**
         * 代理Next-Level点击,通常在异步请求数据成功后点击
         * @param i
         * @param item
         */
        function proxyClick(i, item) {
            $areaselect.find('.tab-content[data-area=' + i + '] a').each(function () {
            	if($areaselect.settings.saveType == "c"){
            		if ($(this).attr("data-value") == item) {
                        $(this).parent().find('.next-level').trigger("click");
                     }
            	}else{
            		if ($(this).text() == item) {
                       $(this).parent().find('.next-level').trigger("click");
                    }
            	}
            });
        }

        /**
         * 代理Items选中，通常在异步请求数据成功后选中
         * @param i
         * @param item
         * @param silent 是否不触发onchange
         */
        function proxySelect(i, item, silent) {
            $areaselect.find('.tab-content[data-area=' + i + '] a').each(function () {
            	if($areaselect.settings.saveType == "c"){
            		if($(this).attr("data-value") == item) {
                        $(this).trigger("click", silent);
                        //将选择界面设置到最后一级
                        $(this).parent().find('.next-level').trigger("click");
                    }
            	}else{
            	    if($(this).text() == item) {
                        $(this).trigger("click", silent);
                        $(this).parent().find('.next-level').trigger("click");
                    }
            	}
            });
        }
        
        function afterBuildDropdown() {
            // set first as current
            addCurr($areaselect.find(".dropdown-content-tab li").eq(0));
            // close handle
            $areaselect.find('.areaselect-dropdown-close').click(function () {
                $areaselect.$dropdown.hide();
            });

            // tabs handle
            $areaselect.find(".dropdown-content-tab li").on('click', function () {
            	var index = $(this).attr('data-index');
                if ($(this).hasClass("tab-curr") || inCanNotModifyLevel(index)) {
                    return false;
                }
                // remove tab-curr style
                $areaselect.find(".tab-curr").each(function () {
                    // dischoised and hide it
                    var tabIndex = $(this).attr('data-index');
                    hideTab(tabIndex);
                });
                
                removeCurr();
                // choiced and show it
                addCurr($(this));
               
                showTab(index);
            });

            // list content handle
            $areaselect.off("click", '.area-list-content a').on('click', '.area-list-content a', function (event, silent) {
            	var preSelectedValue = $areaselect.find('.area-list-content a.selected').attr("data-value");
            	
                // clear
                $areaselect.find('.area-list-content a.selected').removeClass('selected');
                // 选中
                $(this).addClass('selected');

                var tabIndex = $(this).parents('.tab-content').eq(0).attr('data-area');
                tabIndex = parseInt(tabIndex);

                var items = [];
                for(var i = 0; i < tabIndex; i++){
                	 var item = {};
                     item[$areaselect.settings.valueField] = getTabValue(i);
                     item[$areaselect.settings.labelField] = getTabText(i);
                     item[$.sbtools.CONSTANTS.DATA_SBITEM_KEY] = getTabItem(i, item[$areaselect.settings.valueField]);
                     items.push(item);
                }
                
                var text = $(this).text();
                var value = $(this).attr("data-value");
                var currentItem = {};
                currentItem[$areaselect.settings.valueField] = value;
                currentItem[$areaselect.settings.labelField] = text;
                currentItem[$.sbtools.CONSTANTS.DATA_SBITEM_KEY] = $(this).data($.sbtools.CONSTANTS.DATA_SBITEM_KEY);
               
                items.push(currentItem);
                
                var showValue = "";
                for(var k = 0; k < items.length; k++){
                	showValue = showValue + items[k][$areaselect.settings.labelField];
                	if(k != items.length - 1){
                		showValue += $areaselect.settings.labelDelimiter;
                	}
                }
                $areaselect.$input.val(showValue);
                $areaselect.selectedItems = items;
                  
                // refresh tab title
                refreshTabText(tabIndex, text, value);
                // close dropdown or not
                
                adjustDropDownContentTabWidth();
                adjustContainerPosition();
                
                if(!silent && preSelectedValue != value && $areaselect.settings.onChange){
                	triggerChange([currentItem]);
                }
                return false;
            }).on('mouseenter', '.area-list-content a', function () {
                $(this).next(".next-level").show();
            }).on('mouseleave', '.area-list-content li', function () {
                // clear style
                $(this).find(".next-level").hide();
            }).off('click', '.next-level').on('click', '.next-level', function () {// next level handle
                // refresh tab-content by value
                var value = $(this).prev("a").eq(0).attr('data-value');
                var text = $(this).prev("a").eq(0).text();

                var tabIndex = $(this).parents('.tab-content').eq(0).attr('data-area');
                tabIndex = parseInt(tabIndex);
                // refresh title
                refreshTabText(tabIndex, text, value);
                //hide next-level
                $(this).hide();
                // hide current
                hideTab(tabIndex);
                removeCurr();
                // show target
                var targetIndex = tabIndex + 1;
                // refresh area-list content before show it

                refreshAreaList(targetIndex, value);
                showTab(targetIndex);
                addCurr($areaselect.find('.dropdown-content-tab li[data-index=' + targetIndex + ']'));
                
                //当目标索引号为最后level的时候,下拉列表不需要保持打开
                /*if(targetIndex != $areaselect.settings.level){
                     $areaselect.$keepDropdown = true;
                }*/
                return false;
            });

            // clear all
            $areaselect.find(".clear-all-btn").on("click", function () {
                $areaselect.setValue("");
            });
            $areaselect.$dropdown.on("mouseleave",function(){
                if($areaselect.$keepDropdown){
                    $areaselect.$keepDropdown = null;
                    return;
                }
                
                //防止下拉层展开时,点击选项导致url请求时,下拉层会突然隐藏的问题
                if($areaselect.isAjaxLoading && $areaselect.$dropdownContent.is(":visible")){
                	return;
                }
                
                if($areaselect.getValue() && $areaselect.getValue().length>0){
                    $areaselect.$dropdown.hide();
                }
            });

            //处理设值的问题
            process$Proxy(0, $areaselect.settings.level - 1);
            adjustShowTab();
            canNotModifyLevel();
        }
        
        /**
         * @param currentLevel:当前的层级从0开始
         * @param maxLevel:最大的层级从0开始,此值为settings.level-1
         */
        function process$Proxy(currentLevel, maxLevel){
        	if ($areaselect.data('$proxy' + currentLevel)) {
        		var proxyData = $areaselect.data('$proxy' + currentLevel);
        		$areaselect.removeData('$proxy' + currentLevel);
        		if(proxyData.method == "proxySelect"){
        			proxySelect(proxyData.i, proxyData.item, proxyData.silent);
        		}else if(proxyData.method == "proxyClick"){
        			proxyClick(proxyData.i, proxyData.item);
        		}
            }
       
            var array = getConvertValueArray();
        	//一次完整的设值完成  (array.length == currentLevel)条件是考虑设值不全的情况,如level=3,设值为长度为1或者2的情况
        	if ((currentLevel == maxLevel) || (array.length == currentLevel)) {
        		 if($areaselect.valueHolder.hasValue()){
        		      var tempCompleteCallBack = $areaselect.valueHolder.getCompleteCallBack();
        		      $areaselect.valueHolder.remove();
        		      if(tempCompleteCallBack){
        		    	  tempCompleteCallBack();
        		      }
                      
                      if($areaselect.valueHolder.hasValue() > 0){
                	      doActualSetValue($areaselect.valueHolder.getVal(), 
                	    		           $areaselect.valueHolder.getCompleteCallBack(), 
                	    		           $areaselect.valueHolder.getIsDefaultVal());
                      }
        		 }
          	}
        }
        
        /**
         * 当存在初始化值的时候，调用process$Proxy会导致实际显示的Tab是多个的问题
         */
        function adjustShowTab(){
        	if($areaselect.settings.value !== null && $areaselect.settings.value !== undefined){
        		removeCurr();
            	$areaselect.find('.tab-content').hide();
            	
            	var tempConvertValue = getConvertValueArray();
            	var showTabIndex = tempConvertValue.length;
            	if(tempConvertValue.length >= Number($areaselect.settings.level)){
            		showTabIndex = $areaselect.settings.level - 1;
            	}
           
            	$areaselect.$dropdownTabs.find("ul.dropdown-content-tab>li[data-index='"+(showTabIndex)+"']").addClass("tab-curr");
            	showTab(showTabIndex);
        	}
        }
        
        /**
         * 不能修改的层级,通过disabled来模拟
         */
        function canNotModifyLevel(){
       	     if($areaselect.settings.disabled){
       		      return;
       	     }
       	 
       	     if($areaselect.settings.readonly){
       		      return;
       	     }
  
       	     //修改所有的为可用
       	     var tabDisabledClass = "areaselect-dropdown-tab-disabled";
       	     var $tabHeader = $areaselect.find("ul.dropdown-content-tab");
   	         $tabHeader.children("li").each(function(){
				  $(this).removeClass(tabDisabledClass);
			 });
       	  
       	     if(hasCanNotModifyLevelConfig()){
       	    	   if($.isArray($areaselect.settings.canNotModifyLevel)){
       	    	      for(var i = 0; i < $areaselect.settings.canNotModifyLevel.length; i++){
       		            var levelIndex =  $areaselect.settings.canNotModifyLevel[i];
       		            $areaselect.find('.dropdown-content-tab li[data-index=' + levelIndex + ']').addClass(tabDisabledClass);
       		          }
       	    	   }else{
       	    		    //一定是单数字
       	    		   $areaselect.find('.dropdown-content-tab li[data-index=' + $areaselect.settings.canNotModifyLevel + ']').addClass(tabDisabledClass);
       	    	   }
        	 }
        }
        
        function inCanNotModifyLevel(level){
        	if(!hasCanNotModifyLevelConfig()){
        		return false;
        	}
        	
        	if($.isArray($areaselect.settings.canNotModifyLevel)){
        		for(var i = 0; i < $areaselect.settings.canNotModifyLevel.length; i++){
   		          var levelIndex =  $areaselect.settings.canNotModifyLevel[i];
   		          if(level == levelIndex){
   		        	  return true;
   		          }
   		       }
        	}else{
        		return ($areaselect.settings.canNotModifyLevel == level);
        	}
        	return false;
        }
        
        function hasCanNotModifyLevelConfig(){
        	return ($areaselect.settings.canNotModifyLevel !== null && $areaselect.settings.canNotModifyLevel !== undefined);
        }

        /**
         * Refresh tab text
         * @param level
         * @param text
         */
        function refreshTabText(level, text, value) {
            var refreshText = text || "请选择";
            var $container = $areaselect.find('.dropdown-content-tab li[data-index=' + level + ']');
            $container.find("em").text(refreshText);
            $container.find("a").attr("data-value", value);

            // refresh next level if nessesary
            var nextLevelIndex = parseInt(level) + 1;
            var nextLevel = $areaselect.find('.dropdown-content-tab li[data-index=' + nextLevelIndex + ']');
            if (nextLevel.length > 0) {
                refreshTabText(nextLevelIndex, null, null);
            }
        }

        /**
         * Get Tab text by level
         * @param level
         * @returns {*}
         */
        function getTabText(level) {
            var $container = $areaselect.find('.dropdown-content-tab li[data-index=' + level + ']');
            return $container.find('em').text();
        }
        
        function getTabValue(level) {
            var $container = $areaselect.find('.dropdown-content-tab li[data-index=' + level + ']');
            return $container.find('a').attr("data-value");
        }
        
        function getTabItem(level, dataValue){
       	    var $container = $areaselect.find(".tab-content[data-area='" + level + "']");
            return $container.find("a[data-value='"+dataValue+"']").data($.sbtools.CONSTANTS.DATA_SBITEM_KEY);
        }

        /**
         * Get level data,Should support ajax lazy data and already load data
         * @param level
         */
        function getDataByParent(pid, json) {
            var array = new Array();
            for(var i = 0; i < json.length; i++){
            	var jsonItem = json[i];
            	var p = jsonItem[$areaselect.settings.parentField];
                if (p == pid) {
                    array.push(jsonItem);
                }
            }
            return array;
        }

        function asynLoad(postData, callback, args) {
        	$.extend(postData, $areaselect.settings.otherRequestParam || {});
        	
            $.ajax({
                url: $areaselect.settings.url,
                data: JSON.stringify(postData),//JSON.stringify(postData),
                type: 'POST',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                beforeSend: function (xhr) {
                	$areaselect.isAjaxLoading = true;
                    if ($areaselect.settings.beforeSend) {
                        $areaselect.settings.beforeSend.apply(this, [xhr]);
                    }
                },
                complete: function (XHR, TS) {
                	$areaselect.isAjaxLoading = false;
                    if ($areaselect.settings.complete) {
                        var completeArgs = [];
                        completeArgs.push(XHR);
                        completeArgs.push(TS);
                        $areaselect.settings.complete.apply(this, completeArgs);
                    }
                },
                success: function (res) {
                    if (args) {
                        args.push(res);
                        callback.apply(this, args);
                    } else {
                        callback.apply(this);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    var e = {};
                    e.code = XMLHttpRequest.status;
                    e.msg = $.sberror.format(e.code, this.url);
                    $.sberror.onError(e);
                }
            });
        }

        /**
         * Refresh Area-list content
         * @param level
         * @param rootId
         */
        function refreshAreaList(level, rootId) {
            var currentLevel = parseInt(level);
            if (rootId) {// 是否存在下层节点标志
                if ($areaselect.settings.data) {
                    rebuildTabContent(currentLevel, rootId, $areaselect.settings.data);
                } else {
                    var postData = {pid: rootId};
                    var args = new Array();
                    args.push(currentLevel);
                    args.push(rootId);

                    asynLoad(postData, function (level, rooId, json) {
                        rebuildTabContent(level, rootId, json);
                    }, args);
                }
            }
            // Next level handle
            currentLevel = currentLevel + 1;
            var nextLevel = $areaselect.find('.tab-content[data-area=' + currentLevel + '] ul.area-list-content');
            if (nextLevel.length > 0) {
                refreshAreaList(currentLevel);
            }
        }

        /**
         * 重建Tab内容
         * @param currentLevel
         * @param rootId
         * @param json
         */
        function rebuildTabContent(currentLevel, rootId, json) {
            var $container = $areaselect.find('.tab-content[data-area=' + currentLevel + '] ul.area-list-content');
            buildAreaList(currentLevel, rootId, json, $container);
            process$Proxy(currentLevel, $areaselect.settings.level - 1);
        }
        
        function isPlaceHolderSupported() {
            return ('placeholder' in document.createElement('input'));
        }

        function removeCurr() {
            $areaselect.find(".tab-curr").removeClass("tab-curr");
        }

        function addCurr($obj) {
            $obj.addClass('tab-curr');
        }

        function hideTab(index) {
            $areaselect.find('.tab-content[data-area=' + index + ']').hide();
        }

        function showTab(index) {
            $areaselect.find('.tab-content[data-area=' + index + ']').show();
        }

        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Base:基础控件
 * 
 */
(function ($) {
	
	$.extend({sbbase:{}});
	
    $.extend($.sbbase, {
    	plugins:['areaselect', 'bigselect', 'button', 'checkbox', 'commonselect', 'date', 
		         'daterange', 'image', 'listbox', 'numbertext', 'password', 'personselect',
		         'radio', 'richtexteditor', 'select', 'tabs', 'text', 'textarea', 'tree',
		         'wizard', 'hidden', 'commontree','baseareaselect', 'ueditor'],
		         
		pluginClassPrefix:"sinobest-",
		
		/**
		 * 根据字符串值转换为其对应的数组对象的控制器
		 */
		translateController:{
			
			/**
			 * $pluginObj:插件对象,对象必须包含settings属性,且settings中有[transUrl,data,saveType,delimiter,valueField,labelField]属性
			 * 
			 * paramObj:参数对象
			 *          --value:字符串值   【必须值】
			 *          
			 * callBack:转换完成后的回调函数 【必须值】
			 */
			translate:function($pluginObj, paramObj, callBack){
	        	//当transUrl为空且本地数据不存在则返回
	        	if(!$pluginObj.settings.transUrl 
	        			&& ($pluginObj.settings.data === null || $pluginObj.settings.data === undefined)){
	        		return callBack([]);
	        	}
	        	
	        	var postData = {
	        		"value":paramObj["value"],
	        		"saveType":$pluginObj.settings.saveType
	        	};
	        	
	        	if($pluginObj.settings.otherRequestParam){
	        		$.extend(postData, $pluginObj.settings.otherRequestParam || {});
	        	}
	        	
	        	if($pluginObj.settings.onTranslateRequest && $.isFunction($pluginObj.settings.onTranslateRequest)){
					 postData = ($pluginObj.settings.onTranslateRequest).apply($pluginObj, [postData]);
				}
	        	
	        	var _this = this;
	        	if($pluginObj.settings.data != null && $pluginObj.settings.data != undefined){
	        		_this.translateFromLocal($pluginObj, postData, 
	        				                 function(dataResponse){
	        			                            _this.translateResponseCallBack($pluginObj, dataResponse, callBack);
	        		                         });
	        	}else{
	        		_this.translateFromUrl($pluginObj, postData,
	        				                function(dataResponse){
	        			                          _this.translateResponseCallBack($pluginObj, dataResponse, callBack);
	        			                    });
	        	}
			},
			
			/**
			 * 本地转换
			 */
	        translateFromLocal: function($pluginObj, postData, translateCompleteCallBack){
	        	var value = postData["value"];
	        	if($.sbtools.isBlank(value)){
	        		translateCompleteCallBack([]);
	        		return;
	        	}
	        	
	        	var valueArray = [];
	        	if($pluginObj.settings.delimiter){
	        		valueArray = value.split($pluginObj.settings.delimiter);
	        	}else{
	        		valueArray = value.split(";");
	        	}
	   
	            var dataItemKey = $pluginObj.settings.valueField;
	        	if(postData["saveType"] === "d"){
	        		dataItemKey = $pluginObj.settings.labelField;
	        	}
	        	 
	        	var findItems = [];
	        	for(var vI = 0; vI < valueArray.length; vI++){
	        	    for(var i = 0; i < $pluginObj.settings.data.length; i++){
	                	var dataItem = $pluginObj.settings.data[i];
	                	if(dataItem[dataItemKey] == valueArray[vI]){
	        				findItems.push(dataItem);
	        				break;
	        			}
	        		}
	        	}
	        	translateCompleteCallBack(findItems);
	        },
	        
	        /**
	         * 转换响应后的回调
	         */
	        translateResponseCallBack:function($pluginObj, dataResponse, callBack){
	        	if($pluginObj.settings.translateCallback && $.isFunction($pluginObj.settings.translateCallback)){
					($pluginObj.settings.translateCallback).apply($pluginObj, [dataResponse]);
	            }else{
	            	if($pluginObj.settings.onTranslateResponse && $.isFunction($pluginObj.settings.onTranslateResponse)){
	       				 ($pluginObj.settings.onTranslateResponse).apply($pluginObj, [dataResponse]);
	       			}
	            	callBack(dataResponse);
	            }
	        },
	        
	        /**
	         * url转换
	         */
	        translateFromUrl:function($pluginObj, postData, translateCompleteCallBack){
	        	$.ajax({
					type : "post",
					contentType : "application/json; charset=utf-8",
					dataType : "json",
					data : JSON.stringify(postData),
					url : $pluginObj.settings.transUrl,
					success : function(dataResponse) {
						translateCompleteCallBack(dataResponse);
					},
					error : function(XMLHttpRequest, textStatus, errorThrown) {
						var e = {};
						e.code = XMLHttpRequest.status;
						e.msg = $.sberror.format(e.code, this.url);
						$.sberror.onError(e);
					}
				});
	        }
		}
    });
    
    /**
     * 值的存储器：采用队列的数据存储结构,先进先出
     */
    function ValueHolder() {
        this.items = [];
    }
    
    ValueHolder.CONSTANTS = {
    	VAL_KEY:"val",                              //当前的值
    	COMPLETE_CALLBACK_KEY:"completeCallBack",   //设值完成的回调函数
    	IS_DEFAULT_VAL_KEY:"isDefaultValue",        //是否默认值
    	CONVERT_VAL_KEY:"convertVal"                //转换的值
    };
    
    ValueHolder.prototype = {
    		/**
    		 * 是否存在值
    		 */
    		hasValue: function(){
    			if(this.items.length > 0){
    				return true;
    			}
    			return false;
    		},
    		
    		/**
    		* 将值元素推入队列尾部
    		* @param value 要推入队列的值元素,值类型为对象
    		*/
    		add: function(value) {
    		    this.items.push(value);
    		},
    		
    		/**
    		 * 增加基础的值
    		 * @param val 当前的值
    		 * @param completeCallBack 完成回调函数
    		 */
    		addBase:function(val, completeCallBack){
    			this.items.push(this.createBaseValue(val, completeCallBack));
    		},
    		
    		/**
    		 * 创建基本对象
    		 * @param val 
    		 * @param completeCallBack
    		 */
    		createBaseValue:function(val, completeCallBack){
    			 var baseValue = {};
     			 baseValue[ValueHolder.CONSTANTS.VAL_KEY] = val;
     			 baseValue[ValueHolder.CONSTANTS.COMPLETE_CALLBACK_KEY] = completeCallBack;
     			 return baseValue;
    		},
    		
    		/**
    		 * 增加基础值2
    		 */
    		addBase2: function(val, completeCallBack, isDefaultValue){
    			var baseValue = this.createBaseValue(val, completeCallBack);
    			baseValue[ValueHolder.CONSTANTS.IS_DEFAULT_VAL_KEY] = isDefaultValue;
    			this.items.push(baseValue);
    		},
    		
    		/**
    		* 将队列中第一个值元素移除
    		* @return  返回被弹出的值元素
    		*/
    		remove: function() {
    		  return this.items.shift();
    		},
    		
    		/**
    		* 查看队列的第一个元素
    		* @return {Any} 返回队列中第一个元素
    		*/
    		first: function() {
    		   return this.items[0];
    		},
    		
    		/**
    		 * 获取第一个元素对象的值属性值
    		 * @returns
    		 */
    		getVal:function(){
    			return this.getPropValBy(ValueHolder.CONSTANTS.VAL_KEY);
    		},
    		
    		/**
    		 * 获取第一个元素对象的完成回调函数的值
    		 * @returns
    		 */
    		getCompleteCallBack:function(){
    			return this.getPropValBy(ValueHolder.CONSTANTS.COMPLETE_CALLBACK_KEY);
    		},
    		
    		/**
    		 * 获取第一个元素对象的是否默认值的值
    		 * @returns
    		 */
    		getIsDefaultVal:function(){
    			return this.getPropValBy(ValueHolder.CONSTANTS.IS_DEFAULT_VAL_KEY);
    		},
    		
    		/**
    		 * 获取第一个元素对象的转换值的值
    		 * @returns
    		 */
    		getConvertVal:function(){
    			return this.getPropValBy(ValueHolder.CONSTANTS.CONVERT_VAL_KEY);
    		},
    		
    		/**
    		 * 获取值通过关键字
    		 * @param key
    		 * @returns
    		 */
    		getPropValBy:function(key){
    			var first = this.first();
    			if(first !== null && first !== undefined){
    				return first[key];
    			}
    			return "";
    		},
    		
    		/**
    		 * 设置第一个元素的值
    		 * @param key
    		 * @param val
    		 */
    		setVal:function(key, val){
    			var first = this.first();
    			if(first !== undefined && first !== null){
    				first[key] = val;
    			}
    		},
    		
    		/**
    		 * 是处理状态中 当长度大于1表示处于处理状态
    		 * @returns {Boolean}
    		 */
    		isProcessState:function(){
    			if(this.items.length > 1){
    				return true;
    			}
    			return false;
    		}
    };
    
    $.sbbase.ValueHolder = ValueHolder;
    
    $.sbbase.getDomElementAttributes = function(domElement){
        var attributes = "{";
        // DOM attributes
        $.each(domElement.attributes, function (i, attr) {
            if (i > 0) {
                attributes += ",";
            }
            var attrValue = attr.value.replace(/\\/g, "\\\\")
                                      .replace(/\"/g, '\\"')
                                      .replace(/\n/g, "\\n")
                                      .replace(/\r/g, "\\r")
                                      .replace(/\t/g, "\\t")
                                      .replace(/\v/g, "\\v");
            attributes += ('"' + attr.name + '":"' + attrValue + '"');
        });
        attributes += "}";
        return $.parseJSON(attributes);
    }
    
    var baseWidget = (function(){
    	 var coreWidget;
    	 return function(){
    		 if(coreWidget){
    			 return coreWidget;
    		 }else{
    	            coreWidget = {};
    			    /**
    		    	 * 必须的基本方法
    		    	 * 控件必须实现：getDefaultOptions()
    		    	 */
    	            coreWidget["baseMethods"]= {
    		        	    getState: function(){
    		            		return $.extend({}, $.sbbase.getDomElementAttributes(this.getDom()));
    		                },
    		                
    		            	setState: function(stateJson){
    		            	},
    		            	
    		            	getClassName: function(){
    		            		return this.getDefaultOptions().className;
    		            	},
    		            	
    		            	getDom: function(){
    		            		return this[0];
    		            	},
    		            	
    		            	reload: function(){
    		            	},
    		            	
    		            	display: function(show){
    		            		if (show) {
    		                        this.show();
    		                    } else {
    		                        this.hide();
    		                    }
    		                    return this;
    		            	},
    		            	
    		            	destroy: function(){
    		            		return this.remove();
    		            	}
    		    	};
    		    	
    		    	/**
    		    	 * 值控件相关的方法
    		    	 */
    		    	coreWidget["valueMethods"] = {
    		    		getValue: function(){
    		    	    },
    		    	    
    		    	    getLabel: function(){
    		    	    },
    		    	    
    		    	    setValue: function(value){
    		    	    },
    		    	    
    		        	validate: function(){
    		        	},
    		        	
    		        	getName: function(){
    		        	},
    		        	
    		        	load: function(dataSource){
    		        	}
    		    	};
    		    	return coreWidget;
    		 }
    	 }
    })();
    
    /**
     * 控件增加默认的方法实现.当控件实际方法和默认方法逻辑不一致时,自定义实现即可.
     * 
     * @param $widget 当前的控件对象的jquery对象
     * @param options 选项
     *                -- isAddValueMethod:true 增加值控件相关的方法,默认值true
     */
    $.sbbase.mixinWidget = function($widget, options){
    	var newOptions = $.extend({isAddValueMethod:true}, options || {});
    	
    	var widget = baseWidget();
    	for (var bname in widget["baseMethods"]) {
    		if (!$widget[bname]){
    			$widget[bname] = widget["baseMethods"][bname];
    		}
    	}
    	
    	if(newOptions.isAddValueMethod){
    		for(var vname in widget["valueMethods"]) {
        		if (!$widget[vname]){
        			$widget[vname] = widget["valueMethods"][vname];
        		}
        	}
    	}
    };
    
})(jQuery);/**
 * Sinobest-Baseareaselect:一般的地区选择组件
 * 
 * Dependency:sinobest.tools.js
 */
(function ($) {
	
	var defaults = {
			className:"sinobest-baseareaselect",
	   	    name:null,
	   	    value:null,
	   	    valueField:"code",
	   	    labelField:"detail",
	   	    data:null,
	   	    url:null,
	        required:false,
	        requiredLevel:null,
	        textRequired:false,
	        textMinlength:null,
	        textMaxlength:null,
	        readonly:false,
	        disabled:false,
	        saveType:"c",
	        level:3,
	        hasInputText:true,
	        rootId:null,
	        parentField:"pId",
	        otherRequestParam:null,
	        delimiter:null,
	        isAddEmpty:true,
	        emptyText:"请选择",
	        onAjaxRequest:null,
	        onAjaxResponse:null,
	        onChange:null,
	        canNotModifyLevel:null,
	        callback:null,
	        mode:"all",     //all:全选模式    branch:树枝模式
	        transUrl:null,
	        onTranslateRequest:null,
	        onTranslateResponse:null,
	        onInitComplete:null,
	        defaultValue:null,
	        setValueTriggerChange:true
	};
	
	var UICONSTANTS = {
		 dataValueKey:"data-code",  //html元素中valueField的属性名称
		 dataLevelKey:"data-level", //html元素中level的属性名称,level的值默认从0开始
		 dataEmptyKey:"data-empty", //html元素中empty选择属性名称
		 tempSelectSetValueKey:"$tempSelectSetValue", //select控件临时设置的值名称,当select控件创建完成,需要处理
		 itemParentIdKey:"parentId"  //选择项的父节点id关键字
    };

    $.fn.sbbaseareaselect = function (options) { 
        var $sbbaseareaselect = this;
        var settings;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $sbbaseareaselect.settings = settings;

        function getter() {
            return $sbbaseareaselect.data("$sbbaseareaselect");
        }

        function setter() {
        	$sbbaseareaselect.data("$sbbaseareaselect", $sbbaseareaselect);
        }
        
        function isContain() {
            return $sbbaseareaselect.data("$sbbaseareaselect");
        }
        
        $.sbbase.mixinWidget($sbbaseareaselect);

        $sbbaseareaselect.getValue = function(){
        	return getSelectedValues($sbbaseareaselect.settings.saveType);
        };
        
        /**
         * 获取控件选择的值.
         * 当所有select和text为空,则返回空;
         * 当select和text其中一个不为空,则返回所有select和text的值,其中为空的也包括.
         * 当mode=branch时，则返回最后一个select和text的值.
         */
        function getSelectedValues(type, isGetAllValue){
        	//下拉控件中未选择值的数量,当存在输入框时,为空也计算到内
        	var blankCount = 0;
        	
        	var selectItems = [];
        	for(var i = 0, length = $sbbaseareaselect._$selects.length; i < length; i++){
    			var $select =  $sbbaseareaselect._$selects[i];
    			 
    			var selectItem = {};
    			
    			var codeValue = getSelectedValue($select, "c"); 
    			selectItem[$sbbaseareaselect.settings.valueField] =  codeValue;
    			if($.sbtools.isBlank(codeValue)){
    				blankCount++;
    			}
    			
    			var labelValue = getSelectedValue($select, "d"); 
    			if(labelValue === $sbbaseareaselect.settings.emptyText){
    				labelValue = "";
    			}
    			selectItem[$sbbaseareaselect.settings.labelField] = labelValue;
    			selectItems.push(selectItem);
        	}
        	
        	if($sbbaseareaselect.settings.hasInputText){
        		var inputTextVal = $sbbaseareaselect._$text.val();
    			if($.sbtools.isBlank(inputTextVal)){
    				blankCount++;
    			}
    			
    			var inputTextItem = {};
    			inputTextItem[$sbbaseareaselect.settings.valueField] = inputTextVal;
    			inputTextItem[$sbbaseareaselect.settings.labelField] = inputTextVal;
    			selectItems.push(inputTextItem);
        	}
        	
        	var actualLevel = $sbbaseareaselect.settings.level;
        	if($sbbaseareaselect.settings.hasInputText){
        		actualLevel++;
        	}
        	
        	if(blankCount == actualLevel){
        		if($sbbaseareaselect.settings.delimiter){
            		return "";
            	}else{
            		return [];
            	}
        	}else{
        		var values = [];
            	if(type == "c"){
            		for(var ci = 0, clength = selectItems.length; ci < clength; ci++){
            			values.push(selectItems[ci][$sbbaseareaselect.settings.valueField]);
                	}
            	}else{
            		for(var dj = 0, dlength = selectItems.length; dj < dlength; dj++){
                		values.push(selectItems[dj][$sbbaseareaselect.settings.labelField]);
                	}
            	}
            	
            	//处理不同mode配置的返回值
            	var newValues = [];
            	if($sbbaseareaselect.settings.mode === "all" || isGetAllValue){
            		newValues = values;
            	}else{
            		newValues = values.slice(($sbbaseareaselect.settings.hasInputText ? selectItems.length -2: selectItems.length - 1));
            	}
            	
            	if($sbbaseareaselect.settings.delimiter){
            		return newValues.join($sbbaseareaselect.settings.delimiter);
            	}
            	return newValues;
        	}
        }
        
        /**
         * 获取select控件选择的值
         */
        function getSelectedValue($selectControl, valueType){
        	if(valueType === "c"){
        		return getSelectedOption($selectControl).attr(UICONSTANTS.dataValueKey);
        	}else if(valueType === "d"){
        		return getSelectedOption($selectControl).text();
        	}else{
        		return getSelectedOption($selectControl).data($.sbtools.CONSTANTS.DATA_SBITEM_KEY);
        	}
        }
        
        function getSelectedOption($selectControl){
        	return $selectControl.find("option:selected");
        }
        
        $sbbaseareaselect.getLabel = function(){
        	return getSelectedValues("d");
        };
        
        $sbbaseareaselect.setValue = function(value){
        	doSetValue(value, function(){
        		triggerChangeWhenSetValue();
        	});
        };
        
        function triggerChangeWhenSetValue(){
        	if($sbbaseareaselect.settings.setValueTriggerChange){
    			triggerChange($sbbaseareaselect.getSelectItems(), "all");
    		}
        }
        
        function triggerChange(selectItems, currentLevel){
        	if($.isFunction($sbbaseareaselect.settings.onChange)){
  				 $sbbaseareaselect.settings.onChange.apply($sbbaseareaselect, [selectItems, currentLevel]);
            }
        }
        
        function doSetValue(value, completeCallBack, isDefaultValue){
        	$sbbaseareaselect.valueHolder.addBase2(value, completeCallBack, (isDefaultValue || false));
        	if(!$sbbaseareaselect.isBuilded){
        		return;
        	}
        	if($sbbaseareaselect.valueHolder.isProcessState()){
        		return;
        	}
        	doActualSetValue(value, completeCallBack, isDefaultValue);
        }
        
        function doActualSetValue(value, completeCallBack, isDefaultValue){
        	$sbbaseareaselect.settings.value = value;
        	//当设置的值为空,且存在默认值,且canNotModifyLevel存在,则需要设置默认值
        	if($.sbtools.isBlank(value) && $.sbtools.isNotBlank($sbbaseareaselect.settings.defaultValue)
        			&& hasCanNotModifyLevelConfig()){
        		value = $sbbaseareaselect.settings.defaultValue;
        		isDefaultValue = true;
        	}
        	
        	//convertvalue的值在此控件中一定是字符串
        	var convertvalue = $.sbtools.convertSetValue(value);
        	if($sbbaseareaselect.settings.mode === "all" || isDefaultValue){
            	if($sbbaseareaselect.settings.hasInputText){
            		$sbbaseareaselect._$text.setValue(convertvalue);
            	}
            	$sbbaseareaselect._$selects.setValue(convertvalue);
        	}else{
        		//树枝模式的设置需要转换
            	translate(convertvalue, function(resData){
            	    if($sbbaseareaselect.settings.delimiter){
                		resData = resData.concat(convertvalue.split($sbbaseareaselect.settings.delimiter));
                	}else{
                		resData = resData.concat(convertvalue.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER));
                	}
            	    
            	    var newConvertvalue = "";
            	    if($sbbaseareaselect.settings.delimiter){
            	    	newConvertvalue = resData.join($sbbaseareaselect.settings.delimiter);
            	    }else{
            	    	newConvertvalue = $.sbtools.convertSetValue(resData);
            	    }
            		
            		if($sbbaseareaselect.settings.hasInputText){
                 		 $sbbaseareaselect._$text.setValue(newConvertvalue);
                 	}
            		$sbbaseareaselect._$selects.setValue(newConvertvalue);
                });
        	}
        }
        
        /**
         * value的值一定是字符串
         */
        function translate(value, callback){
        	if($.sbtools.isBlank(value)){
        		return callback([]);
        	}
        	
        	if($sbbaseareaselect.settings.hasInputText){
       		   if($sbbaseareaselect.settings.delimiter){
       			   value = value.split($sbbaseareaselect.settings.delimiter)[0];
       		   }else{
       			   value = value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER)[0];
       		   }
          	}
        	
        	if($sbbaseareaselect.settings.data){
        		return callback(translateInData(value));
        	}
        	
        	if(!$sbbaseareaselect.settings.transUrl){
        		return callback([]);
        	}
        	
        	var postData = {
        		"value":value,
        		"saveType":$sbbaseareaselect.settings.saveType,
        		"level":$sbbaseareaselect.settings.level
        	};
        	
        	$.extend(postData, $sbbaseareaselect.settings.otherRequestParam || {});
     	    
        	if($sbbaseareaselect.settings.onTranslateRequest && $.isFunction($sbbaseareaselect.settings.onTranslateRequest)){
				 postData = ($sbbaseareaselect.settings.onTranslateRequest)(postData);
			}
      	
        	$.ajax({
				type : "post",
				contentType : "application/json; charset=utf-8",
				dataType : "json",
				data : JSON.stringify(postData),
				url : $sbbaseareaselect.settings.transUrl,
				success : function(dataResponse) {
                	if($sbbaseareaselect.settings.onTranslateResponse && $.isFunction($sbbaseareaselect.settings.onTranslateResponse)){
           				($sbbaseareaselect.settings.onTranslateResponse)(dataResponse);
           			}
                    callback(dataResponse);
				},
				error : function(XMLHttpRequest, textStatus, errorThrown) {
					var e = new Object();
					e.code = XMLHttpRequest.status;
					e.msg = $.sberror.format(e.code, this.url);
					$.sberror.onError(e);
				}
			});
        }
        
        /**
         * 本地数组的转换,返回当前value的所有父类的id的数组,不存在则返回[].
         */
        function translateInData(value){
        	var findFiled = $sbbaseareaselect.settings.saveType === "c" 
        		            ? $sbbaseareaselect.settings.valueField : $sbbaseareaselect.settings.labelField;
        	
            //找到自身
        	var foundItem = null;
        	for(var i = 0; i < $sbbaseareaselect.settings.data.length; i++){
        		var item = $sbbaseareaselect.settings.data[i];
        		if(item[findFiled] === value){
        			foundItem = item;
        			break;
        		}
        	}
        	
        	if(foundItem === null){
        		return [];
        	}
        	
        	var parentIds = [];
            if($sbbaseareaselect.settings.level !== 1){
            	var parentId = foundItem[$sbbaseareaselect.settings.parentField];
            	parentIds.push(parentId);
            	
            	//找到当前值的父类
            	for(var pi = 0; pi < $sbbaseareaselect.settings.level - 2; pi++){
            		var currentItem = getItemFormData(parentId);
            		if(currentItem == null){
            			break;
            		}else{
            			parentId = currentItem[$sbbaseareaselect.settings.parentField];
            			parentIds.push(parentId);
            		}
            	}
            	
            	//数组倒序,按照父类的先后顺序返回
            	parentIds.reverse();
            }
        	return parentIds;
        }
        
        function getItemFormData(id){
        	for(var i = 0; i < $sbbaseareaselect.settings.data.length; i++){
        		var item = $sbbaseareaselect.settings.data[i];
        		
        		if(item[$sbbaseareaselect.settings.valueField] === id){
        			return item;
        		}
        	}
        	return null;
        }
        
        $sbbaseareaselect.setState = function(stateJson){
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    if (k == 'value') {
                    	$sbbaseareaselect.setValue(v);
                    } else {
                        if (k == 'required') {
                        	$sbbaseareaselect.settings.required = v;
                        } else if (k == 'disabled') {
                        	$sbbaseareaselect.settings.disabled = v;
                        	disabled(v);
                        } else if(k == 'readonly'){
                        	$sbbaseareaselect.settings.readonly = v;
                        	readonly(v);
                        } else if(k == 'canNotModifyLevel'){
                        	$sbbaseareaselect.settings.canNotModifyLevel = v;
                        	canNotModifyLevel();
                        }else{
                        	$sbbaseareaselect.settings[k] = v;
                        	$sbbaseareaselect.attr(k, v);
                        }
                    }
                } else {
                	$sbbaseareaselect.removeAttr(k);
                }
            });
            return $sbbaseareaselect;
        };
		
        $sbbaseareaselect.getDefaultOptions = function(){
        	return defaults;
        };
        
        $sbbaseareaselect.reload = function(){
        	$sbbaseareaselect.empty();
        	$.sbtools.initController.removeInitCompleteFlag($sbbaseareaselect, "$sbbaseareaselect");
        	render();
        };
        
        $sbbaseareaselect.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		$sbbaseareaselect.settings.data= null;
        		$sbbaseareaselect.settings.url = null;
        		
       		    if($.isArray(dataSource)){
       		    	$sbbaseareaselect.settings.data = dataSource;
       		    }else{
       		    	$sbbaseareaselect.settings.url = dataSource;
       		    }
       		    $sbbaseareaselect.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };

        $sbbaseareaselect.validate = function () {
        	 var isFunc = $.isFunction(settings.callback);
             if (isFunc) {
            	 return this.settings.callback.apply(this, [this.settings, this.getValue()]);
             } else {
                 if (settings.required) {
                 	 var v = getSelectedValues($sbbaseareaselect.settings.saveType, true);
                 	 if($.sbtools.isBlank(v)){
                 		return $.sbvalidator.AREASELECT_TEXT_REQUIRED;
                 	 }
                 	 
                 	 if($sbbaseareaselect.settings.requiredLevel){
                 		 if($sbbaseareaselect.settings.delimiter){
                 			  v = v.split($sbbaseareaselect.settings.delimiter);
                 		 }
                 		 
                 		 for(var i = 0; i < $sbbaseareaselect.settings.requiredLevel; i++){
                 			 if($.sbtools.isBlank(v[i])){
                 				 return $.sbvalidator.AREASELECT_TEXT_REQUIRED;
                 			 }
                 		 }
                 	 }
                 	 
                 	 if($sbbaseareaselect.settings.hasInputText){
                 		 var isOk = false;
                 		 var textValue = $sbbaseareaselect._$text.val();
                 		 if($sbbaseareaselect.settings.textRequired){
                 			 isOk = $.sbvalidator.required($sbbaseareaselect._$text[0], textValue);
                 			 if(!isOk){
                      			return $.sbvalidator.AREASELECT_TEXT_REQUIRED;
                      		 }
                 		 }
                 		
                 		 if ($sbbaseareaselect.settings.textMinlength) {
                            isOk = $.sbvalidator.minlength($sbbaseareaselect._$text[0], textValue, $sbbaseareaselect.settings.textMinlength);
                            if (!isOk) {
                                return $.sbvalidator.minLengthPromptMessage($sbbaseareaselect.settings.textMinlength);
                            }
                        }
                 		
                        if ($sbbaseareaselect.settings.textMaxlength) {
                            isOk = $.sbvalidator.maxlength($sbbaseareaselect._$text[0], textValue, $sbbaseareaselect.settings.textMaxlength);
                            if (!isOk) {
                                return $.sbvalidator.maxLengthPromptMessage($sbbaseareaselect.settings.textMaxlength);
                            }
                        }
                 	 }
                 }

                 return "";
             }
        };
        
        $sbbaseareaselect.getName = function(){
        	return $sbbaseareaselect.settings.name;
        };
        
        $sbbaseareaselect.getSelectItems = function(){
        	//下拉控件中未选择值的数量,包括文本框
        	var blankCount = 0;
        	var selectItems = [];
        	
        	for(var i = 0, length = $sbbaseareaselect._$selects.length; i < length; i++){
    			var $select =  $sbbaseareaselect._$selects[i];
    			var codeValue = getSelectedValue($select, "c"); 
    			if($.sbtools.isBlank(codeValue)){
    				blankCount++;
    				selectItems.push("");
    			}else{
    				selectItems.push(getSelectedValue($select,"item"));
    			}
        	}
        	
        	if($sbbaseareaselect.settings.hasInputText){
        		var inputTextVal = $sbbaseareaselect._$text.val();
    			if($.sbtools.isBlank(inputTextVal)){
    				blankCount++;
    				selectItems.push("");
    			}else{
    				var inputTextItem = {};
        			inputTextItem[$sbbaseareaselect.settings.valueField] = inputTextVal;
        			inputTextItem[$sbbaseareaselect.settings.labelField] = inputTextVal;
        			selectItems.push(inputTextItem);
    			}
        	}
        	
        	var actualLevel = $sbbaseareaselect.settings.level;
        	if($sbbaseareaselect.settings.hasInputText){
        		actualLevel++;
        	}
        	
        	if(blankCount == actualLevel){
        		 return [];
        	}else{
            	if($sbbaseareaselect.settings.mode === "all"){
            		return selectItems;
            	}else{
            		return selectItems.slice(($sbbaseareaselect.settings.hasInputText ? selectItems.length -2: selectItems.length - 1));
            	}
        	}
        };
        
        function disabled(flag){
        	disabledText(flag);
        	disabledSelect(flag);
        }
        
        function disabledText(flag){
        	if($sbbaseareaselect.settings.hasInputText){
        		$sbbaseareaselect._$text.attr("disabled", flag);
    			$.sbtools.toggleInputDisabledClass($sbbaseareaselect._$text, flag);
        	}
        }
        
        function disabledSelect(flag){
        	for(var i = 0; i < $sbbaseareaselect._$selects.length; i++){
				$sbbaseareaselect._$selects[i].attr("disabled", flag);
				$.sbtools.toggleSelectDisabledClass($sbbaseareaselect._$selects[i], flag);
			}
        }
        
        function readonly(flag){
        	 //disabled的优先级高于readonly
            if($sbbaseareaselect.settings.disabled){
            	return;
            }
            
            if($sbbaseareaselect.settings.hasInputText){
       	        $sbbaseareaselect._$text.attr("readonly", flag);
			    $.sbtools.toggleInputDisabledClass($sbbaseareaselect._$text, flag);
       	    }
			
			for(var i = 0; i < $sbbaseareaselect._$selects.length; i++){
			    $.sbtools.toggleSelectReadonlyClass($sbbaseareaselect._$selects[i], flag);
			    $.sbtools.eventSimulationSelectReadonly($sbbaseareaselect, $sbbaseareaselect._$selects[i], flag);
			}
        }
        
        /**
         * 不能修改的select,通过disabled来模拟
         */
        function canNotModifyLevel(){
        	 if($sbbaseareaselect.settings.disabled){
        		 return;
        	 }
        	 
        	 if($sbbaseareaselect.settings.readonly){
        		 return;
        	 }
   
        	 if(hasCanNotModifyLevelConfig()){
        		 disabledSelect(false);
        		 if($.isArray($sbbaseareaselect.settings.canNotModifyLevel)){
        			 for(var i = 0; i < $sbbaseareaselect.settings.canNotModifyLevel.length; i++){
           			      var selectIndex =  $sbbaseareaselect.settings.canNotModifyLevel[i];
           			      if(selectIndex < $sbbaseareaselect._$selects.length){
           				     $sbbaseareaselect._$selects[selectIndex].attr("disabled", true);
           				     $.sbtools.toggleSelectDisabledClass($sbbaseareaselect._$selects[selectIndex], true);
           			      }
            	     }
        		 }else{
        			 $sbbaseareaselect._$selects[$sbbaseareaselect.settings.canNotModifyLevel].attr("disabled", true);
      				 $.sbtools.toggleSelectDisabledClass($sbbaseareaselect._$selects[$sbbaseareaselect.settings.canNotModifyLevel], true);
        		 }
        	 }
        }
        
        /**
         * 是否有canNotModifyLevel配置
         */
        function hasCanNotModifyLevelConfig(){
        	return ($sbbaseareaselect.settings.canNotModifyLevel !== null && $sbbaseareaselect.settings.canNotModifyLevel !== undefined);
        }
        
        function initComplete(){
        	$.sbtools.initController.initComplete($sbbaseareaselect, "$sbbaseareaselect", function(){
        		if(!isContain()){
            		setter();
            	}
        	}, $sbbaseareaselect.settings.onInitComplete);
        }
        
        /**
         * 渲染控件的UI结构
         */
    	function render(){
    		$sbbaseareaselect.isBuilded = false;
    		$sbbaseareaselect.addClass($sbbaseareaselect.settings.className);
    		$sbbaseareaselect.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
    		$sbbaseareaselect.addClass("sinobest-widget-container");
    		
    		verifyLevel();
    		//默认下拉需全部选择
    		if($sbbaseareaselect.settings.requiredLevel === undefined || $sbbaseareaselect.settings.requiredLevel === null){
    			$sbbaseareaselect.settings.requiredLevel = $sbbaseareaselect.settings.level;
    		}
    		$sbbaseareaselect.valueHolder = new $.sbbase.ValueHolder();
    		
    		renderSelect();
    		renderText();
    		
    		disabled($sbbaseareaselect.settings.disabled);
    		readonly($sbbaseareaselect.settings.readonly);
    		canNotModifyLevel();
    		
    		buildBaseAreaselect();
    		
    		if($sbbaseareaselect.settings.value !== undefined && $sbbaseareaselect.settings.value !== null){
    			doSetValue($sbbaseareaselect.settings.value, function(){
    				initComplete();
    				triggerChangeWhenSetValue();
    			});
    		}else{
    			//处理默认值
    			if($sbbaseareaselect.settings.defaultValue !== undefined && $sbbaseareaselect.settings.defaultValue !== null){
    				doSetValue($sbbaseareaselect.settings.defaultValue, function(){
        				initComplete();
        				triggerChangeWhenSetValue();
        			}, true);
    			}else{
    				initComplete();
    			}
    		}
    		
    		setter();
            return $sbbaseareaselect;
    	}
    	
    	/**
    	 * 校验level的值
    	 */
    	function verifyLevel(){
    		if(Number($sbbaseareaselect.settings.level) <= 0){
    			$sbbaseareaselect.settings.level = defaults.level;
    		}
    	} 
    	
    	function renderSelect(){
    		$sbbaseareaselect._$selects = [];
    		for(var i = 0; i < $sbbaseareaselect.settings.level; i++){
    			var $select = $("<select></select>");
    			$select.addClass("sinobest-baseareaselect-select");
    			
    			$select.attr(UICONSTANTS.dataLevelKey, i);
    			
    			$sbbaseareaselect.append($select);
    			$sbbaseareaselect._$selects.push($select);
    		}
    	}
    	
    	function renderText(){
    		if($sbbaseareaselect.settings.hasInputText){
    			var $text = $('<input type="text"></input>');
    			$text.addClass("sinobest-baseareaselect-text");
    			
    			$sbbaseareaselect.append($text);
    			$sbbaseareaselect._$text = $text;
    		}
    	}
    	
        /**
         * 构建控件，注册事件，控件交互，初始化数据等动态功能
         */
        function buildBaseAreaselect(){
        	bindSelect();
        	bindText();
        	
        	observeSelectChange();
        	
      		//第一次初始化构建下拉select
        	var item = {};
        	item[UICONSTANTS.itemParentIdKey] = $sbbaseareaselect.settings.rootId;
            rebuildSelectContent(0, item, true);
        }
        
        function bindSelect(){
        	$sbbaseareaselect._$selects.setValue = function(value){
        		for(var i = 0; i < $sbbaseareaselect.settings.level; i++){
        			this[i].find("option:selected").each(function(index, element){
        				 $(element).get(0).selected = false;
                    });
            	}
        		
        		if($.sbtools.isBlank(value)){
        			optionSelect(this[0], "");
        		    this[0].trigger("change", true);
        			return;
        		}
        		
        		var arrayValue = [];
        		if($sbbaseareaselect.settings.delimiter){
        			arrayValue = value.split($sbbaseareaselect.settings.delimiter);
        		}else{
        			arrayValue = value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER);
        		}
      
        		//勾选值
        		var length = $sbbaseareaselect.settings.level > arrayValue.length ? arrayValue.length : $sbbaseareaselect.settings.level;
        		for(var j = 0; j < length; j++){
        			 //设置level=0的值选中
        			 if(j === 0){
        			     optionSelect(this[0], arrayValue[0]);
        				 continue;
        			 }
        			 //设置其他level的select到临时值中
    			     this[j].data(UICONSTANTS.tempSelectSetValueKey, arrayValue[j]);	
        		}
        		//触发其他select初始化并勾选,通过change事件
        		this[0].trigger("change", true);
        	};
        }
        
        function optionSelect($select, value){
        	if($sbbaseareaselect.settings.saveType === "c"){
        		var $findOption = $select.find("option["+UICONSTANTS.dataValueKey+"='"+value+"']");
        		if($findOption.length > 0){
        			$findOption.get(0).selected = true;
        		} 
        	}else{
                $select.find("option").each(function(index, element){
                	 if($(element).text() === value){
                		 $(element).get(0).selected = true;
                		 return false;
                	 }
                });
        	}
        }
        
        function bindText(){
        	if(!$sbbaseareaselect.settings.hasInputText){
        		return;
        	}
        	
        	$sbbaseareaselect._$text.setValue = function(value){
        		this.val("");
        		if($.sbtools.isBlank(value)){
        			return;
        		}
        		
        		var arrayValue = [];
        		if($sbbaseareaselect.settings.delimiter){
        			arrayValue = value.split($sbbaseareaselect.settings.delimiter);
        		}else{
        			arrayValue = value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER);
        		}
        		
        		if(arrayValue.length == $sbbaseareaselect.settings.level + 1){
        			this.val(arrayValue[$sbbaseareaselect.settings.level]);
        		}
        	};
        }
        
        /**
         * select控件注册change事件
         * 当前select触发chagne的时候,会自动级联下一级的select进行初始化
         */
        function observeSelectChange(){
        	//最后一级level不需要触发
        	for(var i = 0; i < $sbbaseareaselect._$selects.length - 1; i++){
        		var $select = $sbbaseareaselect._$selects[i];
        		
        		/**
        		 * silent    是否触发用户注册的change事件
        		 * firstLoad 是否第一次加载
        		 */
        		$select.on("change", function(event, silent, firstLoad){
       			   var currentLevel = $(this).attr(UICONSTANTS.dataLevelKey);
       			   var currentId =  getSelectedValue($(this), "c");
     	   
       			   if(!silent && $sbbaseareaselect.settings.onChange){
       				   var selectItem = {};
       				   selectItem[$sbbaseareaselect.settings.valueField] = currentId; 
       				   selectItem[$sbbaseareaselect.settings.labelField] = getSelectedValue($(this), "d");
       				   triggerChange([selectItem], currentLevel);
       			   }
       			   
       			   var item = {};
            	   item[UICONSTANTS.itemParentIdKey] = currentId;
            	   item[UICONSTANTS.dataEmptyKey] =  getSelectedOption($(this)).attr(UICONSTANTS.dataEmptyKey);
       			   rebuildSelectContent(Number(currentLevel)+1, item, firstLoad);
       		    });
        		
        	}
        }
        
        /**
         * 重新构建下拉选择内容区域
         * @param level: 当前的select层级
         * @param parentId:父ID
         * @param firstLoad:初始化构建
         */
        function rebuildSelectContent(level, item, firstLoad){
        	if($sbbaseareaselect.settings.data){
        		refreshSelectContent(level, getDatasByParentId(item), firstLoad);
        		if(isFirstComplete(firstLoad, level)){
        			firstComplete();
        		}else{
        			lastLevelComplete(level);
        		}
        	}else{
                 asynLoad(item, function (data) {
                	  var newData = data || [];
                      refreshSelectContent(level, newData, firstLoad);
                      if(isFirstComplete(firstLoad, level)){
                    	  firstComplete();
              		  }else{
              			  lastLevelComplete(level);
              		  }
                 });
        	}
        }
        
        /**
         * 最后一个level构建完成时处理
         */
        function lastLevelComplete(level){
        	 if(level !== $sbbaseareaselect.settings.level - 1){
        		 return;
        	 }
        	 
        	 var tempCompleteCallBack = $sbbaseareaselect.valueHolder.getCompleteCallBack();
        	 $sbbaseareaselect.valueHolder.remove();
		     if(tempCompleteCallBack){
		    	 tempCompleteCallBack();
		     }
		     processTempData();
        }
        
        /**
         * 所有层级数据加载完成才表示第一次加载完成
         */
        function isFirstComplete(firstLoad, level){
        	 if(firstLoad && level === $sbbaseareaselect.settings.level - 1){
        		 return true;
        	 }
        	 return false;
        }
        
        /**
         * 初始化加载完成后,需要为控件设值
         */
        function firstComplete(){
        	$sbbaseareaselect.isBuilded = true;
        	processTempData();
        }
        
        function processTempData(){
        	if($sbbaseareaselect.valueHolder.hasValue()){
        		  doActualSetValue($sbbaseareaselect.valueHolder.getVal(), 
	    		           $sbbaseareaselect.valueHolder.getCompleteCallBack(), 
	    		           $sbbaseareaselect.valueHolder.getIsDefaultVal());
        	}
        }
        
        function getDatasByParentId(item){
        	if(itemIsEmptyOption(item)){
        		return [];
        	}
        	
        	var parentId = item[UICONSTANTS.itemParentIdKey];
        	var findDatas = [];
        	for(var i = 0; i < $sbbaseareaselect.settings.data.length; i++){
        		var data = $sbbaseareaselect.settings.data[i];
        		if(data[$sbbaseareaselect.settings.parentField] == parentId){
        			findDatas.push(data);
        		}
        	}
        	return findDatas;
        }
        
        //增加的空选择,选择的时候不请求后台数据
        function itemIsEmptyOption(item){
        	if(item[UICONSTANTS.dataEmptyKey] !== undefined
        	           && item[UICONSTANTS.dataEmptyKey] === "true"){
            	return true;
            }
        	return false;
        }
        
        function asynLoad(item, callback) {
        	if(itemIsEmptyOption(item)){
        		callback([]);
        		return;
        	}
        	
        	var postData = {"pid": item[UICONSTANTS.itemParentIdKey]};
        	$.extend(postData, $sbbaseareaselect.settings.otherRequestParam || {});
        	
        	if($sbbaseareaselect.settings.onAjaxRequest && $.isFunction($sbbaseareaselect.settings.onAjaxRequest)){
        		postData = ($sbbaseareaselect.settings.onAjaxRequest)(postData);
		    }
        	
            $.ajax({
                url: $sbbaseareaselect.settings.url,
                data: JSON.stringify(postData),
                type: 'POST',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                	if($sbbaseareaselect.settings.onAjaxResponse && $.isFunction($sbbaseareaselect.settings.onAjaxResponse)){
					    ($sbbaseareaselect.settings.onAjaxResponse)(res);
					}
                	callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    var e = {};
                    e.code = XMLHttpRequest.status;
                    e.msg = $.sberror.format(e.code, this.url);
                    $.sberror.onError(e);
                }
            });
        }
        
        /**
         * 刷新指定level的下拉选择内容,当前level刷新后会级联level+1的内容
         * 
         * @param level:当前层级
         * @param datas:当前层级下拉框的数据
         * @param firstLoad:是否第一次加载
         */
        function refreshSelectContent(level, datas, firstLoad){
        	var $currentSelect = $sbbaseareaselect._$selects[level];
        	if(!$currentSelect){
        		return;
        	}
        	
        	$currentSelect.find("option").remove();
        	 
        	if($sbbaseareaselect.settings.isAddEmpty){
        		var $emptyOptioin = $("<option "+ UICONSTANTS.dataEmptyKey + "='true'  "+UICONSTANTS.dataValueKey+"=''></option>");
				$emptyOptioin.text($sbbaseareaselect.settings.emptyText);
        		$emptyOptioin.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, "");
        		$currentSelect.append($emptyOptioin);
        	}
        	
        	for(var i = 0; i < datas.length; i++){
        		var data = datas[i];
        		var $option = $("<option></option>");
        		$option.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, data);
        		$currentSelect.append($option);
        		
        		$option.text(data[$sbbaseareaselect.settings.labelField]);
        		$option.attr(UICONSTANTS.dataValueKey, data[$sbbaseareaselect.settings.valueField]);
        		
        	}
        	
        	if($currentSelect.data(UICONSTANTS.tempSelectSetValueKey)){
            	optionSelect($currentSelect, $currentSelect.data(UICONSTANTS.tempSelectSetValueKey));
            	$currentSelect.removeData(UICONSTANTS.tempSelectSetValueKey);
            }
            	
        	//解决IE7中url请求,第一个之后的select没有显示全的问题
        	if($.sbtools.isIE7()){
        		$currentSelect.hide();
            	$currentSelect.show();
        	}
        	
        	$currentSelect.trigger("change", [true,firstLoad]);
        }
        
        return this.each(function () {
            render(); 
        });
        
    };
    
})(jQuery);/**
 * Sinobest-Bigselect:大数据分页选择组件
 *  
 * Dependency:selectize.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-bigselect",
        required: false,
        readonly: false,
        disabled: false,
        url: null,
        saveType: "c",
        type: 'single',
        pageSize: 10,
        paging: true,
        valueField: "code",
        labelField: "detail",
        searchField: ["detail"],
        options: [],
        persist: null,
        create: null,
        onItemAdd: null,
        onItemRemove: null,
        plugins: null,
        editEnable: false, //是否开启编辑模式
        name: "",
        id: "",
        callback: null,
        value: null,
        onAjaxRequest: null,
        onAjaxResponse: null,
        delimiter:null,
        style:null,
        pageConfig:{
           pageField:"page",
           pageSizeField:"pageSize",
           queryField:"query",
           totalCountField:"totalCount",
           pageCountField:"pageCount",
           dataField:"data"
       },
       transUrl:null,
       onTranslateRequest:null,
       onTranslateResponse:null,
       translateCallback:null,
       firstLabel:"<<",
       prevLabel:"<",
       nextLabel:">",
       lastLabel:">>",
       selectAllLabel:"全选",
       clearAllLabel:"全删",
       colModel:null,
       enableLocalSearchFilter:true,  
       onChange:null,
       hideSelected:false,   //是否显示已选择的
       zIndex:null,
       remoteSort:false,      //远程排序
       onInitComplete:null,
       data:null,
       setValueTriggerChange:true
    };

    $.fn.sbbigselect = function (options) {
        var $bigselect = this;
        var settings;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }

        $bigselect.settings = settings;

        var $select;
        var control = null;

        function getter() {
            return $bigselect.data("$bigselect");
        }

        function setter() {
            $bigselect.data("$bigselect", $bigselect);
        }

        function isContain() {
            return $bigselect.data("$bigselect");
        }

        $.sbbase.mixinWidget($bigselect);
        
        $bigselect.getValue = function () {
        	//调用control.getValue返回值单选是字符串，多选是数组
        	var value = control.getValue();
            if($bigselect.settings.delimiter && $bigselect.settings.type == "multiple"){
                return value.join($bigselect.settings.delimiter);
            }
            return value;
        };
        
        $bigselect.getLabel = function(){
        	var labels = control.getItems();
        	if($bigselect.settings.delimiter){
                 return labels.join($bigselect.settings.delimiter);
            }
        	if($bigselect.settings.type == "multiple"){
        		return labels;
        	}else{
        		if(labels === null || labels.length <= 0){
        			return "";
        		}else{
        			return labels[0];
        		}
        	}
        };
        
        $bigselect.getSelectItems = function(){
        	return control.getItemList();
        };
        
        $bigselect.setValue = function (v) {
        	doSetValue(v, function(){
        		triggerChangeWhenSetValue();
        	});
        };
        
        function triggerChangeWhenSetValue(){
        	if($bigselect.settings.setValueTriggerChange){
        		var key = getSelectedValue();
    			triggerChange(key, "add", key);
    		}
        }
        
        /**
         * 获取已选的值
         * 多选：数组
         * 单选：字符串
         */
        function getSelectedValue(){
        	var key = $bigselect.getValue();
    		if($bigselect.settings.type == "multiple"){
    			if($bigselect.settings.delimiter){
                    key = key.split($bigselect.settings.delimiter);
                }
    			if($.sbtools.isBlank(key)){
        			key = [];
        		}
    			return key;
    		}else{
    			if($.sbtools.isBlank(key)){
        			key = "";
        		}	
    			return key;
    		}
        }
        
        function triggerChange(keys, oper, selectKeys){
        	if($.isFunction($bigselect.settings.onChange)){
        		$bigselect.settings.onChange.apply($bigselect, [keys, oper, selectKeys]);
            }
        }
        
        
        function doSetValue(v, completeCallBack){
            if (control === null) {
                return;
            }
        	control.clear(true);
        	
        	var convertvalue = $.sbtools.convertSetValue(v);
            if($.isArray(convertvalue)){
            	processActualSetValue(convertvalue, completeCallBack, v);
            }else{
            	if($.sbtools.isNotBlank(convertvalue)){
            		$.sbbase.translateController.translate($bigselect, {"value":convertvalue}, function(items){
            			processActualSetValue(items, completeCallBack, v);
                  	});
            	}else{
            		$bigselect.settings.value = "";
            		if(completeCallBack && $.isFunction(completeCallBack)){
              			completeCallBack();
                	}
            	}
            }
        };
        
        /**
         * 处理实际的设值
         * 
         * items:设置值的数组对象
         * completeCallBack:完成回调函数
         * v:原始设置的值
         */
        function processActualSetValue(items, completeCallBack, v){
        	addItem(items, true);
      		$bigselect.settings.value = v;
      		if($bigselect.settings.disabled || $bigselect.settings.readonly){
      			clearButtonInvisible(true);
        	}
      		
      		if(completeCallBack && $.isFunction(completeCallBack)){
      			completeCallBack();
        	}
        }
        
        /**
         * v必须是数组
         */
        function addItem(v, silent){
        	if(!$.isArray(v)){
        		return;
        	}
        	
        	var key = settings.valueField;
            var label = settings.labelField;
            for (var i = 0; i < v.length; i++) {
                 var item = v[i];
                 
                 var addItemObject = {};
                 addItemObject[key] =  item[key];
                 addItemObject[label] =  item[label];
                 
                 control.addOption(addItemObject);
                 control.addItem(item[key], silent);
                 
                 if(settings.type == "single"){
                	 return;
                 }
            }
        }
        
        $bigselect.getDetail = function () {
            return control.getItems();
        };

        $bigselect.setState = function (stateJson) {
             $.each(stateJson, function (k, v) {
             	if (v !== undefined && v !== null)  {
                     if (k == 'value') {
                     	$bigselect.setValue(v);
                     } else {
                         if (k == 'disabled') {
                         	$bigselect.settings.disabled = v;
                         	if(v){
                         	   control.disable();
                         	}else{
                         	   control.enable();
                         	}
                         	clearButtonInvisible(v);
                         } else if(k == 'readonly'){
                         	$bigselect.settings.readonly = v;
                         	toggleReadonlyClass(v);
                         	if(v){
                         	   control.lock();
                         	}else{
                         	   control.unlock();
                         	}
                         	clearButtonInvisible(v);
                         } else if(k == 'required'){
                        	 $bigselect.settings.required = v;
                         }else{
                         	 control.$wrapper.attr(k, v);
                         }
                     }
                 } else {
                 	 control.$wrapper.removeAttr(k);
                 }
             });
             return $bigselect;
        };
		
        $bigselect.getDefaultOptions = function(){
        	return defaults;
        };
        
        /**
         * 删除按钮的不可见性控制
         */
        function clearButtonInvisible(flag){
        	if($bigselect.settings.type != "single"){
            	 return;
            }
        	 
        	if(flag){
        		$bigselect.find(".clearSelection").hide();
        	}else{
        		$bigselect.find(".clearSelection").show();
        	}
        }

        $bigselect.getDom = function () {
            return control.$wrapper[0];
        };

        $bigselect.reload = function () {
        	if(!$bigselect.settings.zIndex){
             	 $bigselect.data("oldZindex", $bigselect.find(".selectize-control").css("z-index"));
            }
        	$bigselect.empty();
        	settings = $bigselect.settings;
        	$.sbtools.initController.removeInitCompleteFlag($bigselect, "$sbbigselect");
            render();
        };
        
        $bigselect.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		
        		$bigselect.settings.data= null;
        		$bigselect.settings.url = null;
       		    if($.isArray(dataSource)){
       		    	$bigselect.settings.data = dataSource;
       		    }else{
       		    	$bigselect.settings.url = dataSource;
       		    }
       		    $bigselect.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };

        $bigselect.display = function (b) {
            if (b) {
                control.$wrapper.show();
            } else {
                control.$wrapper.hide();
            }
        };

        $bigselect.destroy = function () {
            $bigselect.remove();
            control.$wrapper.remove();
        };

        $bigselect.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                var v = $bigselect.getValue();
                var isOk = false;

                if (settings.required) {
                    isOk = $.sbvalidator.required($bigselect[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };

        $bigselect.getName = function(){
        	return $bigselect.settings.name;
        };
        
        /**
         * Build Input when single or Select when multiple
         */
        function build() {
            if (settings.type == 'multiple') {
                buildSelect(true);
                renderMultiple();
            } else {
                buildSelect(false);
                renderSingle();
            }
            if (settings.editEnable) {
                settings.createOnBlur = true;
                settings.keepTextOnBlur = true;
                settings.plugins['smart_tag'] = {};
            }
            // selectize-icon
            settings.plugins['smart_icon'] = {};
            
            if(settings.colModel){
               settings.plugins['select_box'] = {
    				   columns:settings.colModel
    		   };
          	   $bigselect._$selectControl.addClass("sinobest-selectbox");
            }
        }

        function buildSelect(multiple) {
            var $selectControl = $('<select></select>');
            $selectControl.attr("id", settings.id);
            $selectControl.attr("name", settings.name);
            
            if (multiple) {
            	$selectControl.attr("multiple", true);
            }
             
            $selectControl.attr("required", settings.required);
            
            if (settings.style){
            	$selectControl.attr("style", settings.style);
            }
            
            $bigselect._$selectControl = $selectControl;
            $bigselect.append($selectControl);
        }

        function addClass($jqueryObj){
        	$jqueryObj.addClass(defaults.className);
        	if(settings.className && settings.className != defaults.className){
        		$jqueryObj.addClass(settings.className);
        	}
        	$jqueryObj.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
        }
        
        function initComplete(){
            $.sbtools.initController.initComplete($bigselect, "$sbbigselect", function(){
                if(!isContain()){
                    setter();
                }
            }, $bigselect.settings.onInitComplete);
        }
        
        function isPaging(){
    		if($bigselect.settings.data != null && $bigselect.settings.data != undefined){
    			return false;
    		}
    		
    		return $bigselect.settings.paging;
    	}
        
        function render() {
        	//当未配置id时，则以初始化元素的ID加_bigselect后缀作为id
    		if($bigselect.settings.id === null || $bigselect.settings.id === ""){
    			$bigselect.settings.id = $bigselect.attr("id") + "_bigselect";
    		}
    		
    		if (settings.editEnable) {
                // 编辑模式强制saveType为detail
                settings.saveType = "d";
            }

            if (settings.saveType == "d") {
                settings.valueField = settings.labelField;
            }
        	
        	addClass($bigselect);
        	 
            if (isPaging()) {
                settings.plugins = {};
                settings.plugins['paging_footer'] = {
                    url: settings.url,
                    pagesize: settings.pageSize,
                    onAjaxRequest: settings.onAjaxRequest,
                    onAjaxResponse: settings.onAjaxResponse,
                    pageConfig:settings.pageConfig,
                    firstLabel:settings.firstLabel,
            	    prevLabel:settings.prevLabel,
            	    nextLabel:settings.nextLabel,
            	    lastLabel:settings.lastLabel,
                    selectAllLabel:settings.selectAllLabel,
                    clearAllLabel:settings.clearAllLabel,
                    remoteSort:settings.remoteSort
                };
            }
            if (settings.plugins === null || typeof settings.plugins === 'undefined') {
                settings.plugins = {};
            }

            build();

            var persist = getOrElse(settings.persist, true);
            var create = getOrElse(settings.create, false);
            var createOnBlur = getOrElse(settings.createOnBlur, false);
            var keepTextOnBlur = getOrElse(settings.keepTextOnBlur, false);
            var onItemAddFunc = getOnItemAddFunc();
            var onChangeFunc = getOnChangeFunc();
            var hideSelected = getOrElse(settings.hideSelected, false);
            var options = [];
            if($bigselect.settings.data){
            	options = $bigselect.settings.data;
            }
            // 声明
            $select = $bigselect._$selectControl.selectize({
                valueField: settings.valueField,
                labelField: settings.labelField,
                searchField: settings.searchField,
                options: options,
                persist: persist,
                create: create,
                hideSelected:hideSelected,
                createOnBlur: createOnBlur,
                keepTextOnBlur: keepTextOnBlur,
                onItemAdd: onItemAddFunc,
                onItemRemove: settings.onItemRemove,
                plugins: settings.plugins,
                enableLocalSearchFilter:settings.enableLocalSearchFilter,
                onChange:onChangeFunc
            });
            control = $select[0].selectize;

            if($bigselect.settings.zIndex){
            	$bigselect.find(".selectize-control").css("z-index", $bigselect.settings.zIndex);
            }else{
            	if($bigselect.data("oldZindex")){
            		 $bigselect.find(".selectize-control").css("z-index", $bigselect.data("oldZindex"));
            	}
            }
            
            // disabled
            if($bigselect.settings.disabled) {
                control.disable();
            }else{
            	control.enable();
            }
            
            //disabled的优先级高于readonly
            if(!$bigselect.settings.disabled){
            	toggleReadonlyClass($bigselect.settings.readonly);
            	if($bigselect.settings.readonly){
                    control.lock();
                }else{
                	control.unlock();
                }
            }
            
            // init value
            var initValue = settings.value;
            if (initValue !== null) {
            	//JSON数组的初始化值
            	if(initValue.indexOf('{')!=-1 && initValue.indexOf('}')!=-1){
            		initValue = $.parseJSON(initValue);
            	}
            	doSetValue(initValue, function(){
					initComplete();
					triggerChangeWhenSetValue();
				});
            }else{
            	initComplete();
            }

            $(document).keyup(function(event){
            	    //tab event
            	    if(event.keyCode == 9){
            	       if(!($(document.activeElement).closest('.sinobest-bigselect').is($bigselect))){
            	    	    control.close();
            	       }
            	    }
            });
            
            setter();
        }

        function toggleReadonlyClass(flag){
        	$.sbtools.toggleDivInputReadonlyClass($bigselect.find(".selectize-input"), flag);
        }
        
        /**
         * Safe setter,return default value when v equals null or undefined
         * @param v
         * @param d
         * @return {*}
         */
        function getOrElse(v, d) {
            if (!v) {
                return d;
            }
            return v;
        }

        function renderSingle() {
            // for single mode
            settings.plugins['single_clear_button'] = {
                className: 'clearSelection',
                label: '',
                title: ''
            };
        };
        function renderMultiple() {
            settings.pagesize = settings.pageSize;
            settings.plugins['toolbar_header'] = {
            	selectAllLabel:settings.selectAllLabel,
            	clearAllLabel:settings.clearAllLabel
            };
        };

        function getOnItemAddFunc(){
        	var onItemAddFunc = settings.onItemAdd;
        	
            if(settings.type == "single"){
            	//IE7单选模式,删除图片按钮靠最右边显示的bug
                if($.sbtools.isIE6OrIE7()){
                	 if(settings.onItemAdd){
                		 onItemAddFunc = function(value, item){
                			 ie7SingleClosePositionCompatibility(item);
                			 settings.onItemAdd(value, item);
                		 };
                	 }else{
                		 onItemAddFunc = function(value, item){
                			 ie7SingleClosePositionCompatibility(item);
                		 };
                	 }
                }
            }
            return onItemAddFunc;
        }
        
        function getOnChangeFunc(){
        	if( $.isFunction(settings.onChange)){
        		return function(value, objectParam){
        			var changeValue = objectParam.value;
        			//多选数组
        			if($bigselect.settings.type == "multiple"){
        				changeValue = [objectParam.value];
        			}
        			triggerChange(changeValue, objectParam.oper, getSelectedValue());
        		};
        	}
        	return null;
        }
        
        /**
         * IE7单选模式,删除按钮靠近最右边显示的bug
         */
        function ie7SingleClosePositionCompatibility(item){
        	var measureString = function(str) {
        		if (!str) {
        			return 0;
        		}
                
        		var $test = $('<test>').css({
        			position: 'absolute',
        			top: -99999,
        			left: -99999,
        			width: 'auto',
        			padding: 0,
        			whiteSpace: 'pre'
        		}).text(str).appendTo('body');

        		var width = $test.width();
        		$test.remove();
        		return width;
        	};
        	
        	var textWidth = measureString($(item).text());
        	//多加35是因为IE在测量字数比较小时，不准确
       	    if(Number($(item).closest("div.selectize-input").width()) > Number(textWidth + 35)){
       		     $(item).width((textWidth + 35));
       	    }
        }
        
        render();
        return this;
    };
})(jQuery);
/**
 * Sinobest-Bubbling:冒泡组件
 * 
 * Dependency:dialog-plus.js,sinobest.dialog.js,sinobest.tools.js
 */
(function ($) {
    $.extend({
        sbbubbling: function (options) {
            var defaults = {
            	className: "sinobest-bubbling",
            	title: "  ",    //title必须有值,才会显示关闭的叉叉按钮
                content: null,
                width:"300px",
			    height:"120px",
                align: "right bottom",
                autoCloseTime:null  //单位是秒
            };
            
            var settings = $.extend({}, defaults, options || {});
            
            var sbbubbling = new Object();
            sbbubbling.sbdialog = null;
            
            sbbubbling.getState = function () {
            	return sbbubbling.sbdialog.getState();
            };

            sbbubbling.setState = function (stateJson) {
            	sbbubbling.sbdialog.setState(stateJson);
            };

			sbbubbling.getClassName = function(){
				return defaults.className;
			};
            sbbubbling.getDom = function () {
            	return sbbubbling.sbdialog.getDom();
            };

            sbbubbling.reload = function () {
            	sbbubbling.sbdialog.destroy();
            	render();
            };
            
            sbbubbling.display = function (b) {
            	sbbubbling.sbdialog.display(b);
            	if(b){
            		adjustBubblingPosition();
            	}
            };

            sbbubbling.destroy = function () {
            	sbbubbling.sbdialog.destroy();
            };
            
            function render() {
            	var dialogConfig ={
            			dialogType:"dialog",
            		    className: settings.className,
                    	title: settings.title,
                        content: settings.content,
                        width: settings.width,
                        height: settings.height
            	};
            	
            	sbbubbling.sbdialog = $.sbdialog(dialogConfig);
            	
            	addBubbingClass();
            	adjustWidth();
            	
            	adjustBubblingPosition();
            	ie6FixedPositionCompatibility();
            	
            	//自动关闭
   			    if(settings.autoCloseTime){
   	               setTimeout(function () {
   	            	  sbbubbling.destroy();
   	               }, settings.autoCloseTime * 1000);
   			    }
            }
            
            /**
             * 增加bubbing的class
             */
            function addBubbingClass(){
            	//位置固定,不随滚动条而滚动
            	$(sbbubbling.getDom()).addClass("sinobest-bubbling-container");
            	$(sbbubbling.getDom()).addClass("sinob-widget-container");
            	//内容区域超过显示的高度则隐藏
            	$(sbbubbling.getDom()).find(".ui-dialog-content").addClass("sinobest-bubbling-content");
            }
            
            /**
             * 调整bubbing对话框的宽度
             */
            function adjustWidth(){
            	if(settings.width){
            		//当标题的宽度过长时,隐藏超出长度的内容.
            		var titleWidth = $(sbbubbling.getDom()).find(".ui-dialog-content").width() 
            		                                      - $(sbbubbling.getDom()).find(".ui-dialog-close").width();
                	$(sbbubbling.getDom()).find(".ui-dialog-title").width(titleWidth).attr("title", settings.title);
                	
                	//当对话框靠右显示时,拖动对话框会发现对话框的宽度很宽
                	if(settings.align.indexOf("right") > -1){
                		$(sbbubbling.getDom()).width($(sbbubbling.getDom()).width());
                	}
            	}
            }
            
            /**
             * 调整显示位置
             */
            function adjustBubblingPosition(){
               sbbubbling.getDom().style.top = null;
               sbbubbling.getDom().style.bottom = null;
               sbbubbling.getDom().style.left = null;
               sbbubbling.getDom().style.right = null;
         	   
         	   var align1 = settings.align.split(" ")[0];
               var align2 = settings.align.split(" ")[1];
               setAlignStyle(align1);
               setAlignStyle(align2);
            }
            
            /**
             * 设置对齐的样式
             */
            function setAlignStyle(align){
            	if(align == 'top'){
            		sbbubbling.getDom().style.top = "0px";
                 }else if(align == 'bottom'){
                	sbbubbling.getDom().style.bottom = "0px";
                 }else if(align == 'left'){
                	sbbubbling.getDom().style.left = "0px";
                 }else if(align == 'right'){
                	sbbubbling.getDom().style.right = "0px";
                 }else if(align == 'center'){
                	sbbubbling.getDom().style.left = ($(window).width() - $(sbbubbling.getDom()).width())/2 + "px";
                 }
            }

            function ie6FixedPositionCompatibility(){
            	//IE6下面position=fixed无效的兼容性,冒泡窗口不能一直置于窗口顶部或者底部
            	if($.sbtools.isIE6()){
            		   //顶部固定
            		   if(settings.align.indexOf("top") > -1){
            			   $(window).scroll(function(event){
               			    	sbbubbling.getDom().style.top = (document.body.scrollTop||document.documentElement.scrollTop);
               		       });
            			   return;
            		   }
            		   
            		  //底部固定
       			      if(settings.align.indexOf("bottom") > -1){
 			    	       $(window).scroll(function(event){
 			    	    	   sbbubbling.getDom().style.top = (document.body.scrollTop||document.documentElement.scrollTop) 
 	 			    	                                            + $(window).height() - $(sbbubbling.getDom()).outerHeight();
              		       });
           			       return;
       			      }
      		    }
            }
            
            render();
            return sbbubbling;
        }

    });
})(jQuery);/**
 * Sinobest-Button:按钮组件
 * 
 * Dependency:sinobest-tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-button",
        disabled: false,
        value: null,
        onClick: null,
        onInitComplete:null
    };

    $.fn.sbbutton = function (options) {
        var settings;
        var $input = this;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $input.settings = settings;

        function getter() {
            return $input.data("$input");
        }

        function setter() {
            $input.data("$input", $input);
        }

        function isContain() {
            return $input.data("$input");
        }
        
        $.sbbase.mixinWidget($input);
        
        /**
         * Get value
         * @return  object
         */
        $input.getValue = function () {
            return $input.val();
        };

        /**
         * Set value
         * @param value new value
         * @return object
         */
        $input.setValue = function (value) {
             $input.val(value);
             $input.settings.value = value;
             return $input;
        };
         
        /**
         * Set new state
         * @param stateJson state json
         * @return  object
         */
        $input.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
                $input.attr(k, v);
            });
            return $input;
        };

		
        $input.getDefaultOptions = function(){
        	return defaults;
        };
		
        /**
         * Reload
         * @return object
         */
        $input.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($input, "$sbinput");
            return render();
        };
        
		function initComplete() {
			$.sbtools.initController.initComplete($input, "$sbinput",
					function() {
						if (!isContain()) {
							setter();
						}
					}, $input.settings.onInitComplete);
		}
        
        /**
		 * Init
		 */
        function render() {
        	$input.addClass("sinobest-button-common");
            $input.addClass($input.settings.className);
            $input.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            $input.attr('disabled', $input.settings.disabled);
            
            if ($input.settings.value !== undefined && $input.settings.value !== null) {
                $input.val($input.settings.value);
            }
            
            if ($input.settings.onClick) {
                $input.off('click').on("click", $input.settings.onClick);
            }
            
            initComplete();
            setter();
            return $input;
        }

        /**
         * Main function
         */
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Checkbox:复选框组件
 * 
 * Dependency:sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-checkbox",
        required: false,
        disabled: false,
        readonly: false,
        direction: 'line', //row、table
        columnCount: null,
        delimiter: null,
        name: null,
        valueField: "code",
        labelField: "detail",
        data: null,
        url: null,
        callback: null,
        value: null,
        onAjaxRequest: null,
	    onAjaxResponse: null,
	    saveType:"c",
	    onChange:null,
	    onInitComplete:null,
	    setValueTriggerChange:true
    };

    $.fn.sbcheckbox = function (options) {
        var settings;
        var $checkbox = this;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $checkbox.settings = settings;

        function getter() {
            return $checkbox.data("$checkbox");
        }

        function setter() {
            $checkbox.data("$checkbox", $checkbox);
        }

        function isContain() {
            return $checkbox.data("$checkbox");
        }

        $.sbbase.mixinWidget($checkbox);
        
        /**
         * Get checkbox value
         * @return {*}
         */
        $checkbox.getValue = function () {
        	if($checkbox.settings.saveType == "c"){
        		var chkValue = [];
                $checkbox.find(":checkbox").filter(':checked').each(function () {
                    chkValue.push($(this).val());
                });
                if ($checkbox.settings.delimiter) {
                    // 按分隔符
                    return chkValue.join($checkbox.settings.delimiter);
                } else {
                    return chkValue;
                }
        	}else{
        		return $checkbox.getLabel();
        	}
        };

        $checkbox.getLabel = function(){
        	 var chkDetail = [];
             $checkbox.find(":checkbox").filter(':checked').each(function () {
                 chkDetail.push($(this).next("label").text());
             });
             if ($checkbox.settings.delimiter) {
                 // 按分隔符
                 return chkDetail.join($checkbox.settings.delimiter);
             } else {
                 return chkDetail;
             }
        };

        $checkbox.getName = function(){
            return  $checkbox.settings.name;
        };

        /**
         * Set Checkbox value
         * @param v
         * @return {*}
         */
        $checkbox.setValue = function (v) {
        	return doSetValue(v, function(){
        		triggerChangeWhenSetValue();
        	});
        };
        
        function doSetValue(v, completeCallBack){
            if (!$checkbox.settings.data) {
                $checkbox.data('$temp', v);
                return $checkbox;
            }
            $checkbox.find(":checkbox").filter(':checked').prop('checked', false);

            if(!v || !$.trim(v)){
            	$checkbox.settings.value = "";
            	if(completeCallBack){
            		completeCallBack();
            	}
            	return;
            }
            
            if (!$.isArray(v)) {
            	if($checkbox.settings.delimiter){
                	v = v.split($checkbox.settings.delimiter);
                }else{
                	v = [v];
                }
            }
            
            if($checkbox.settings.saveType == "c"){
            	 $.each(v, function (idx, value) {
                     $checkbox.find(":checkbox").filter('[value=' + value + ']').prop('checked', true);
                 });
            }else{
            	 $.each(v, function (idx, value) {
                     $checkbox.find("label").each(function(index, element){
              			 if($(element).text() == value){
              				$(element).prev("input[type='checkbox']").prop('checked', true);
              				return false;
              			 }
              		 });
                 });
            }
           
            $checkbox.settings.value = v;
            if(completeCallBack){
        		completeCallBack();
        	}
            return $checkbox;
        }
        
        function triggerChangeWhenSetValue(){
        	 if($.isFunction($checkbox.settings.onChange) && $checkbox.settings.setValueTriggerChange){
            	 var selectedValues = getSelectedValues();
                 triggerChange(selectedValues, "add", selectedValues);
            }
        }

        /**
         * Set state
         */
        $checkbox.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    if (k == 'value') {
                        $checkbox.setValue(v);
                    } else {
                        if (k == 'required') {
                            $checkbox.settings.required = v;
                        }else if(k == 'readonly'){
                        	$checkbox.settings.readonly = v;
                        	disabled(v);
                        }else if (k == 'disabled') {
                            $checkbox.settings.disabled = v;
                            disabled(v);
                        } else{
                        	$checkbox.attr(k, v);
                        }
                    }
                } else {
                    $checkbox.removeAttr(k);
                }
            });
            return $checkbox;
        };
		
        $checkbox.getDefaultOptions = function(){
        	return defaults;
        };
        
        function disabled(flag){
        	$checkbox.find("input:checkbox").attr("disabled", flag);
        }
        
        /**
         * Reload
         */
        $checkbox.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($checkbox, "$sbcheckbox");
            render();
        };
        
        $checkbox.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		$checkbox.settings.data= null;
        		$checkbox.settings.url = null;
        		
       		    if($.isArray(dataSource)){
       		    	$checkbox.settings.data = dataSource;
       		    }else{
       		    	$checkbox.settings.url = dataSource;
       		    }
       		    $checkbox.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };

        /**
         * Validate
         */
        $checkbox.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                var v = $checkbox.getValue();
                var isOk = false;

                if (settings.required) {
                    isOk = $.sbvalidator.required($checkbox[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };

        $checkbox.getSelectItems = function(){
            var selectItems = [];
            $checkbox.find(":checkbox").filter(':checked').each(function () {
                selectItems.push($(this).data($.sbtools.CONSTANTS.DATA_SBITEM_KEY));
            });
            return selectItems;
       };
       

        /**
         * Clear HTML
         */
        function clearCheckbox() {
            $checkbox.html("");
        }

        /**
         * How to generate a checkbox element id
         * @param idx
         * @returns {string}
         */
        function generateId(idx) {
            return $checkbox.settings.name + "_" + idx;
        }

        /**
         * Build Checkbox from data
         * @param data
         */
        function buildCheckbox(data) {
            $.each(data, function (idx, obj) {
                var id = generateId(idx);
                var checkbox = $('<input type="checkbox" id="' + id + '"/>');
				checkbox.attr("name",$checkbox.settings.name);
                var label = $('<label for="' + id + '"></label>');

                $.each(obj, function (k, v) {
                    var isAttr = true;
                    if (k == $checkbox.settings.valueField) {
                        checkbox.val(v);
                        isAttr = false;
                    }
                    if (k == $checkbox.settings.labelField) {
                        label.text(v);
                        isAttr = false;
                    }
                    if (isAttr) {
                    	//IE7以下当设置status时会默认设置为选中
                    	if($.sbtools.isIE6OrIE7()){
                    		if(k != "status"){
                    			checkbox.attr(k, v);
                    		}
                    	}else{
                    		checkbox.attr(k, v);
                    	}
                    }
                });

                checkbox.attr("disabled", $checkbox.settings.disabled);
                if(!$checkbox.settings.disabled){
                	checkbox.attr("disabled", $checkbox.settings.readonly);
                }
                checkbox.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, obj);
                var $container = $("<div></div>");
                $container.append(checkbox).append(label);
                $checkbox.append($container);
            });

            addEventListener();
        }
       
        function addEventListener() {
            // 排列问题
            if (settings.direction == 'table') {
                tableRadio();
            } else if (settings.direction == 'row') {
                verticalRadio();
            } else {
                horizontalRadio();
            }
            
            bindEvent();
            
            if($checkbox.data('$temp')) {
            	$checkbox.settings.value = $checkbox.data('$temp');
                $checkbox.removeData('$temp');
            }
            
            //初始值问题
            if($checkbox.settings.value !== undefined && $checkbox.settings.value !== null) {
                doSetValue($checkbox.settings.value, function(){
                	initComplete();
                	triggerChangeWhenSetValue();
                });
            }else{
            	initComplete();
            }
        }
        
        function bindEvent(){
        	 if($checkbox.settings.onChange){
        		 var $allCheckboxs = $checkbox.find("input:checkbox");
        		 $allCheckboxs.bind("change", function(){
        			 var currentValue = {};
        			 currentValue[$checkbox.settings.valueField] = $(this).attr("value");
        			 currentValue[$checkbox.settings.labelField] = $(this).next("label").text();
        			 
                 	 var oper = "";
                 	 if($(this).is(":checked")){
                 		 oper = "add";
                 	 }else{
                 		 oper = "remove";
                 	 }
                 	 
                 	 triggerChange([currentValue], oper, getSelectedValues());
        		 });
        	 
             }
        }
        
        /**
         * 获取已选选择的值
         */
        function getSelectedValues(){
        	 var selectedValues = [];
        	 $checkbox.find("input:checkbox").each(function(index, element){
				 if($(element).is(":checked")) {
				      var selectedValue = {};
				      selectedValue[$checkbox.settings.valueField] = $(element).attr("value");
				      selectedValue[$checkbox.settings.labelField] = $(element).next("label").text();
				      selectedValues.push(selectedValue);
				  }
         	 });
        	 return selectedValues;
        }
        
        /**
         * currentValue:当前选中的值对象数组
         * oper:操作
         * selectedValues:已选选择的值对象数组
         */
        function triggerChange(currentValue, oper, selectedValues){
        	if($checkbox.settings.onChange){
        		$checkbox.settings.onChange.apply($checkbox, [currentValue, oper, selectedValues]);       		
        	}
        }

        function initComplete(){
            $.sbtools.initController.initComplete($checkbox, "$sbcheckbox", function(){
                if(!isContain()){
                    setter();
                }
            }, $checkbox.settings.onInitComplete);
        }
        
        /**
         * Render checkbox
         */
        function render() {
            $checkbox.addClass(settings.className);
            $checkbox.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            $checkbox.attr('required', $checkbox.settings.required);

            if ($checkbox.settings.url) {
            	var queryRequest = {};
            	if($checkbox.settings.onAjaxRequest && $.isFunction($checkbox.settings.onAjaxRequest)){
				   queryRequest = ($checkbox.settings.onAjaxRequest)(queryRequest);
		        }
            	
                $.ajax({
                    type: "post",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    url: $checkbox.settings.url,
                    data : JSON.stringify(queryRequest),
                    success: function (data) {
                    	if($checkbox.settings.onAjaxResponse && $.isFunction($checkbox.settings.onAjaxResponse)){
   						   ($checkbox.settings.onAjaxResponse)(data);
   					    }
                        $checkbox.settings.data = data;
                        clearCheckbox();
                        buildCheckbox($checkbox.settings.data);
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        var e = {};
                        e.code = XMLHttpRequest.status;
                        e.msg = $.sberror.format(e.code, this.url);
                        // 根据规范要求将错误交给全局函数处理
                        $.sberror.onError(e);
                    }
                });
            } else {
            	if(!$checkbox.settings.data){
            		$checkbox.settings.data = [];
            	}
                clearCheckbox();
                buildCheckbox($checkbox.settings.data);
            }
            setter();
        }

        function tableRadio() {
            var $div = $checkbox.find(":checkbox").parent("div");
            if ($div.parent("td").length > 0) {
                return;
            }
            $div.wrapAll("<table><tbody></tbody></table>");
            var last = null;
            $div.each(function (idx) {
                if (idx % settings.columnCount === 0) {
                    last = $(this).wrap("<tr><td></td></tr>");
                } else {
                    last = $(this).insertAfter(last.parent("td")).wrap("<td></td>");
                }
            });
        }

        function verticalRadio() {
            var $div = $checkbox.find(":checkbox").parent("div");

            if ($div.parent("td").length > 0) {
                return;
            }
            $div.wrapAll("<table><tbody></tbody></table>").wrap("<tr><td></td></tr>");
        }

        function horizontalRadio() {
            var $div = $checkbox.find(":checkbox").parent("div");
            if ($div.parent("td").length > 0) {
                return;
            }
            //$div.wrapAll("<table><tbody><tr></tr></tbody></table>").wrap("<td></td>");
            
            $div.css({"float":"left", "line-height":"23px", "white-space":"nowrap"});
            $div.wrapAll("<table><tbody><tr><td></td></tr></tbody></table>");
        }

        render();
        return this;
    };
})(jQuery);
/**
 * Sinobest-Commonselect:通用数据水平层级选择组件
 * 
 * Dependency:jquery.placeholder.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
    	name:null,
        className: "sinobest-commonselect",
        required: false,
        placeholder: null,
        disabled: null,
        readonly: false,
        callback: null,
        data: null, 
        url: null, 
        value: null,
        valueField: "code",
        labelField: "detail",
        onBeforeSelect: null,
        onAfterSelect: null,
        delimiter:null,
        saveType:"c",
        otherRequestParam:null,
        rootId:0,
        beforeSend:null,
        complete:null,
        parentField:"pId",
        idField:"id",
        onChange:null,
        onInitComplete:null,
        setValueTriggerChange:true
    };

    $.fn.sbcommonselect = function (options) {
        var settings;
        var $commonselect = this;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }

        $commonselect.settings = settings;

        function getter() {
            return $commonselect.data("$commonselect");
        }

        function setter() {
            $commonselect.data("$commonselect", $commonselect);
        }

        function isContain() {
            return $commonselect.data("$commonselect");
        }

        $.sbbase.mixinWidget($commonselect);
        
        /**
         * Get text value
         * @return  object
         */
        $commonselect.getValue = function () {
        	var value = getSelectedValues($commonselect.settings.saveType);
            if($commonselect.settings.delimiter){
            	return value.join($commonselect.settings.delimiter);
            }
            return value;
        };
        
        /**
         * 获取选择的值
         * @return 根据saveType的不同，返回不同的数组对象
         */
        function getSelectedValues(type){
            var selectedItems = $commonselect._inputContainerControl.getSelectedItems();
        	
        	var values = [];
        	if(type == "c"){
        		for(var i = 0, length = selectedItems.length; i < length; i++){
        			values.push(selectedItems[i][$commonselect.settings.valueField]);
        		}
        	}else if(type == "d"){
        		for(var j = 0, jlength = selectedItems.length; j < jlength; j++){
        			values.push(selectedItems[j][$commonselect.settings.labelField]);
        		}
        	}else{
        		values = selectedItems;
        	}
        	return values;
        }

        $commonselect.getLabel = function () {
        	var value = getSelectedValues("d");
            if($commonselect.settings.delimiter){
            	return value.join($commonselect.settings.delimiter);
            }
            return value;
        };
        
        /**
         * Set text value
         * @param value new value
         * @return object
         */
        $commonselect.setValue = function (value) {
        	doSetValue(value, function(){
        		triggerChangeWhenSetValue();
        	});
        	return $commonselect;
        };
        
        function doSetValue(value, completeCallBack){
        	var convertvalue = $.sbtools.convertSetValue(value);
            $commonselect._inputContainerControl.setInitValue(convertvalue, completeCallBack);
            $commonselect.settings.value = value;
        }
        
        /**
         * Set text new state
         * @param stateJson state json
         * @return  object
         */
        $commonselect.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    if (k == 'value') {
                        $commonselect.setValue(v);
                    } else if (k == 'required') {
                        $commonselect.settings.required = v;
                        $commonselect.$input.attr('required', $commonselect.settings.required);
                    } else if (k == 'readonly') {
                        $commonselect.settings.readonly = v;
                        $commonselect.$input.attr('readonly', $commonselect.settings.readonly);
                        $commonselect._inputContainerControl.readonly($commonselect.settings.readonly);
                    } else if (k == 'disabled') {
                        $commonselect.settings.disabled = v;
                        $commonselect.$input.attr('disabled', $commonselect.settings.disabled);
                        toggleDisabledClass(v);
                         
                        $commonselect._inputContainerControl.disabled($commonselect.settings.disabled);
                    } else {
                        $commonselect.attr(k, v);
                    }
                } else {
                    $commonselect.removeAttr(k);
                }
            });
            return $commonselect;
        };
		
        $commonselect.getDefaultOptions = function(){
        	return defaults;
        };

        /**
         * Reload text
         * @return object
         */
        $commonselect.reload = function () {
        	$commonselect.empty();
        	$commonselect.isBuilded = false;
        	$.sbtools.initController.removeInitCompleteFlag($commonselect, "$sbcommonselect");
            return render();
        };
        
        $commonselect.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		$commonselect.settings.data= null;
        		$commonselect.settings.url = null;
        		
       		    if($.isArray(dataSource)){
       		        $commonselect.settings.data = dataSource;
       		    }else{
       		        $commonselect.settings.url = dataSource;
       		    }
       		    $commonselect.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };
        
        /**
         * Validate input
         */
        $commonselect.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                // basic validate
                var isOk = false;
                if (settings.required) {
                	var v = $commonselect.getValue();
                    isOk = $.sbvalidator.required($commonselect.$input[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };

        /**
         * 获取名称
         */
        $commonselect.getName = function(){
        	return $commonselect.settings.name;
        };
        
        $commonselect.getSelectItems = function(){ 
        	var items = getSelectedValues("item");
        	if(items === undefined || items === null || items.length <= 0){
        		return [];
        	}
        	
        	if($commonselect.settings.data == null || $commonselect.settings.data.length <= 0){
        		return [];
        	}
        	
        	var selectItems = [];
        	for(var i = 0; i < items.length; i++){
        		var item = items[i];
        		
        		var findOrginData = getDataByItem(item);
        		if(findOrginData !== null){
        			selectItems.push(findOrginData);
        		}else{
        			selectItems.push(item);
        		}
        	}
        	
        	return selectItems;
        };
        
        function getDataByItem(item){
        	for(var i = 0; i < $commonselect.settings.data.length; i++){
        		var data = $commonselect.settings.data[i];
        		
        		var compareValue = data[$commonselect.settings.valueField];
        		var oldValue =  item[$commonselect.settings.valueField];
        		if($commonselect.settings.saveType === "d"){
        			compareValue = data[$commonselect.settings.labelField];
        			oldValue = item[$commonselect.settings.labelField];
        		}
        		
        		if(oldValue == compareValue){
        			return data;
        		}
        	}
        	return null;
        }
        
        function initComplete(){
        	 $.sbtools.initController.initComplete($commonselect, "$sbcommonselect", function(){
                   if(!isContain()){
                       setter();
                   }
             }, $commonselect.settings.onInitComplete);
        }
        
        function triggerChange(items, oper, selectedItems){
        	if($commonselect.settings.onChange){
        		$commonselect.settings.onChange.apply($commonselect, [items, oper, selectedItems]);
        	}
        }
        
        function triggerChangeWhenSetValue(){
        	if($commonselect.settings.setValueTriggerChange){
        		var items = $commonselect._inputContainerControl.getSelectedItems();
        		triggerChange(items, "add", items);
        	}
        }
        
        /**
         * 输入容器控件
         */
        var InputContainerControl = function(){
        };
        
        InputContainerControl.prototype = {
             /**
              * 构建输入容器控件
              */
        	 buildInputContainer : function(){
             	this.$inputContainerControl = $('<div class="commonselect-input-container commonselect-input-container-active"></div>');
             	this.$input = $('<input type="text" class="commonselect-input"/>');
             	if ($commonselect.settings.name) {
             		this.$input.attr("name", $commonselect.settings.name);
    			}
             	
             	this._setInputInitWidth();
             	
             	//IE6,7:当控件被div包裹且设置div的margin-left属性,界面显示的this.$input输入容器不显示在div最左边的bug
             	if($.sbtools.isIE6OrIE7()){
             		this.$inputContainerControl.append('<div class="virutal-input-item"></div>');
             	}
             	this.$inputContainerControl.append(this.$input);
                $commonselect.append(this.$inputContainerControl);
                $commonselect.$input = this.$input;
                
                this.readonly($commonselect.settings.readonly);
                  
                this.disabled($commonselect.settings.disabled);
                  
             	this._bindInputContainerEvent();
            },
            
            /**
             * 设置输入框的初始化宽度
             */
            _setInputInitWidth : function(){
            	if(this.$input.width() == 1){
            		return;
            	}
            	this.$input.width(1);
            },
            
            /**
             * 绑定输入容器事件
             */
            _bindInputContainerEvent : function(){
            	 var _this = this;
            	 //输入容器绑点击时获取焦点,弹出选择对话框
            	 _this.$inputContainerControl.bind("click", function(){
            		  if(_this.isDisabled()){
            			  return;
            		  }
        		      _this.$input.focus();
        		      
        		      if(_this.isReadonly()){
        		    	  return;
        		      }
        		      _this.$input.trigger('click');
        	     });
            	 
            	 //输入框控件按backspace删除
            	 _this.$input.keydown(function(event){
            		 if(_this.isDisabled() || _this.isReadonly()){
            			 return false;
            		 }
            		 
            		 //backspace
                     if(event.keyCode == "8"){
                    	 var inputPrevItem = _this.removeInputPrevItem();
                    	 $commonselect.$dropdown.unSelectItem(inputPrevItem);
                    	 return false;
                     }
                     
                     //left
                     if(event.keyCode == 37){
                    	if(_this.$input.prev(".input-item").length > 0){
                    		 _this.$input.prev(".input-item").before(_this.$input);
                    		 _this.$input.focus().select();
                    	}
                    	return false;
                     }
            	     
                     //right
            	     if(event.keyCode == 39){
           		         if(_this.$input.next(".input-item").length > 0){
                  		     _this.$input.next(".input-item").after(_this.$input);
                  		     _this.$input.focus().select();
                  	     }
           		         return false;
                     }
            	 
                 });
            },
            
            /**
             * 设置初始化值
             */
            setInitValue : function(value, completeCallBack){
            	this.clearItems();
            	
            	//注意：只要InputContainerControl控件addItems就算设值完成,
            	//     $commonselect.$dropdown.initValue方法作用是对展开层中的值进行勾选操作
            	if($.isArray(value)){
            		this.addItems(value);
            		
            		if($commonselect.isBuilded){
            			$commonselect.$dropdown.initValue(value);
                	}else{
                		$commonselect.data("$tempInitValue", value);
                	}
            		if(completeCallBack && $.isFunction(completeCallBack)){
         		    	completeCallBack();
                 	}
            	}else{
            		if($commonselect.isBuilded){
            			$commonselect.$dropdown.initValue(value);
            			if(completeCallBack && $.isFunction(completeCallBack)){
             		    	completeCallBack();
                     	}
            		}else{
            			$commonselect.data("$tempInitValue", value);
        				doBuildDropdown(completeCallBack);
            		}
            	}
            },
            
            /**
             * 增加明细项
             * @param items
             */
            addItems : function(items){
            	if(items == undefined || items.length <=0){
            		return;
            	}
            	
            	for(var i = 0, length = items.length ; i < length; i++){
            		 var item = items[i];
            		 var $lastItem = this.$inputContainerControl.find(".input-item:last");
            		 
            		 var $addItem = $('<div class="input-item"></div>');
            		 $addItem.attr("code", item[$commonselect.settings.valueField]);
            		 $addItem.text(item[$commonselect.settings.labelField]);
          		     if($lastItem.length <= 0){
          			    this.$input.before($addItem);
          		     }else{
          			    $lastItem.after($addItem);
          		     }
            	}
            	
            	this.updateInputContainerStatus();
            	this.updatePlaceholder();
            	this.updateDropDownContentPosition();
            },
            
            /**
             * 增加明细项
             * @param item
             */
            addItem : function(item){
            	if(item == undefined){
            		return;
            	}
            	this.addItems([item]);
            },
            
            /**
             * 删除明细项
             * @param item
             */
            removeItem : function(item){
            	 this.$inputContainerControl.find(".input-item").each(function(index, element){
            		  if($(element).attr("code") == item[$commonselect.settings.valueField]){
            			  $(element).remove();
            			  return false;
            		  }
            	 });
            	 
            	 this.updateInputContainerStatus();
            	 this.updatePlaceholder();
            	 this.updateDropDownContentPosition();
            },
            
            /**
             * 移除输入控件前的一个明细项
             */
            removeInputPrevItem : function(){
            	 var $inputPrevItem = this.$input.prev(".input-item");
            	 
            	 var inputPrevItem = new Object();
            	 inputPrevItem[$commonselect.settings.valueField] = $inputPrevItem.attr("code");
            	 inputPrevItem[$commonselect.settings.labelField] = $inputPrevItem.text();
            	 
            	 $inputPrevItem.remove();
            	 this.updateInputContainerStatus();
           	     this.updatePlaceholder();
           	     this.updateDropDownContentPosition();
           	     
           	     return inputPrevItem;
            },
            
            /**
             * 清空所有明细
             */
            clearItems: function(){
            	this.$inputContainerControl.find(".input-item").remove();
            	
            	this.updateInputContainerStatus();
            	this.updatePlaceholder();
            	this.updateDropDownContentPosition();
            },
            
            /**
             * 获取选择的项
             *  
             */
            getSelectedItems : function(){
            	var items = [];
            	this.$inputContainerControl.find(".input-item").each(function(index, element){
            		var item = {};
            		item[$commonselect.settings.valueField] = $(element).attr("code");
            		item[$commonselect.settings.labelField] = $(element).text();
            		
            		items.push(item);
          	    });
            	return items;
            },
            
            /**
             * 设置是否可用
             * @param disabled
             */
            disabled : function(disabled){
            	if(disabled){
            		this.$inputContainerControl.addClass("disabled");
            	}else{
            		this.$inputContainerControl.removeClass("disabled");
            	}
            },
            
            /**
             * 是否不可用状态
             * @returns {Boolean}
             */
            isDisabled :function(){
            	if(this.$inputContainerControl.hasClass("disabled")){
            		return true;
            	}
            	return false;
            },
            
            /**
             * 设置是否只读
             * @param readonly
             */
            readonly : function(readonly){
            	$.sbtools.toggleDivInputReadonlyClass(this.$inputContainerControl, readonly);
            },
            
            /**
             * 是否只读状态
             * @returns {Boolean}
             */
            isReadonly : function(){
            	if(this.$inputContainerControl.hasClass("div-input-readonly")){
            		return true;
            	}
            	return false;
            },
            
            /**
             * 修改placeholder属性
             */
            updatePlaceholder : function(){
            	if(!$commonselect.settings.placeholder){
            		return;
            	}
            	
            	if(this.$inputContainerControl.find(".input-item").length > 0){
            		 this.$input.removeAttr('placeholder');
            		 this._setInputInitWidth();
            	}else{
            		 this.$input.val("");
            		 this.$input.attr('placeholder', $commonselect.settings.placeholder);
            		 this.$input.width(this.$inputContainerControl.width()-10);
            	}
            },
            
            /**
             * 修改弹出下拉列表位置
             */
            updateDropDownContentPosition : function(){
            	if($commonselect.$dropdownContent == null){
            		return;
            	}
                var controlOffset = this.$inputContainerControl.offset();
                
                //考虑外部包装的父元素设置position=relative的情况
                var $relativeParent = $("<test></test>");
                this.$inputContainerControl.parents().each(function(){
    	    	     if($(this).css("position") == "relative"){
    	    	    	 $relativeParent = $(this);
    	    	    	 return false;
    	    	     }
    	    	});
                
    		    $commonselect.$dropdownContent.css({left:(controlOffset.left - $relativeParent.offset().left)+ "px", 
    		    	                                top :(controlOffset.top + this.$inputContainerControl.outerHeight() - $relativeParent.offset().top) + "px"});
            },
            
            /**
             * 修改输入容器控件的状态
             * <1>是否有明细项
             */
            updateInputContainerStatus : function(){
            	if(this.$inputContainerControl.find(".input-item").length > 0){
            		this.$inputContainerControl.addClass("has-items");
            	}else{
            		this.$inputContainerControl.removeClass("has-items");
            	}
            }
        };
        
        /**
         * Build input
         */
        function buildInput() {
        	var inputContainerControl = new InputContainerControl();
        	inputContainerControl.buildInputContainer();
        	
        	$commonselect._inputContainerControl = inputContainerControl;
        }

        /**
         * Init
         */
        function render() {
            $commonselect.addClass($commonselect.settings.className);
            $commonselect.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            $commonselect.addClass("sinob-widget-container");
            buildInput();
            
            $commonselect.$input.attr('required', $commonselect.settings.required);
            if ($commonselect.settings.placeholder) {
                $commonselect.$input.attr('placeholder', $commonselect.settings.placeholder);
                // 测试是否支持
                if (!$.sbtools.isPlaceHolderSupported()) {
                    $commonselect.$input.placeholder();
                    
                    //初始化进入的时候无法显示placeholder
                    $commonselect.$input.focus();
                    $commonselect.$input.blur();
                }
            }
            $commonselect._inputContainerControl.updatePlaceholder();
            
            $commonselect.$input.attr('readonly', $commonselect.settings.readonly);
            
            $commonselect.$input.attr('disabled', $commonselect.settings.disabled);
            toggleDisabledClass($commonselect.settings.disabled);
            
            // event listener
            $commonselect.$input.on('click', function () {
                // build or not
                if (!$commonselect.isBuilded) {
                	doBuildDropdown();
                }
                
                $("html").bind("mouseover mouseup", function(event){
					  if (!($(event.target).hasClass("commonselect-input-container") 
						  || $(event.target).hasClass("commonselect-dropdown")
						  || $(event.target).parents("span.commonselect-dropdown").length > 0)) {
						  
						  if($commonselect.$input.is(":focus")){
							  return;
						  }
						  
						  //IE7中之前选择dropdown-content-item-list某项，再次显示时会出现展示项为空白的bug
			              $commonselect.$dropdown.find(".dropdown-content-item-list").hide();
						  $commonselect.$dropdown.hide();
				          $("html").unbind("mouseover");
				     }
		        });
                
                showDropdown();
                return false;
            });
            
            if($commonselect.settings.value !== undefined && $commonselect.settings.value !== null) {
            	doSetValue($commonselect.settings.value, function(){
            		initComplete();
            		triggerChangeWhenSetValue();
            	});
            }else{
            	initComplete();
            }
            
            setter();
            return $commonselect;
        }

        /**
         * 执行构建下拉框
         */
        function doBuildDropdown(completeCallBack){
        	 buildDropdown(completeCallBack);
             $commonselect.isBuilded = true;
        }
        
        /**
         * 显示下拉框
         */
        function showDropdown(){
        	$commonselect._inputContainerControl.updateDropDownContentPosition();
        	$commonselect.$dropdown.show();
        }
        
        //hover事件延迟插件
        $.fn.hoverDelay = function(options){ 
            var defaults = { 
                hoverDuring: 200, 
                outDuring: 200, 
                hoverEvent: function(){ 
                    $.noop(); 
                }, 
                outEvent: function(){ 
                    $.noop(); 
                } 
            }; 
            var sets = $.extend(defaults,options || {}); 
            var hoverTimer, outTimer; 
            return $(this).each(function(){ 
                $(this).hover(function(event){ 
                    clearTimeout(outTimer); 
                    hoverTimer = setTimeout(sets.hoverEvent, sets.hoverDuring); 
                },function(event){ 
                    clearTimeout(hoverTimer); 
                    outTimer = setTimeout(sets.outEvent, sets.outDuring); 
                }); 
            }); 
        };

        function afterBuildDropdown() {
            // 事件监听之类的
        	$commonselect.find('.commonselect-dropdown-content > .dropdown-content-item').each(function(){
        		  var _this = this;
        		  $(_this).hoverDelay({ 
        			    hoverEvent: function(event){ 
        	              /*  var eq = $commonselect.find('.commonselect-dropdown-content > .dropdown-content-item').index(this),				//获取当前滑过是第几个元素
        	                    h = $commonselect.find('.commonselect-dropdown-content').offset().top,						//获取当前下拉菜单距离窗口多少像素
        	                    s = $(window).scrollTop(),									//获取游览器滚动了多少高度
        	                    i = $(_this).offset().top,									//当前元素滑过距离窗口多少像素
        	                    item = $(_this).children('.dropdown-content-item-list').height(),				//下拉菜单子类内容容器的高度
        	                    sort = $commonselect.find('.commonselect-dropdown-content').height();						//父类分类列表容器的高度
 
        	                if (item < sort) {												//如果子类的高度小于父类的高度
        	                    if (eq == 0) {
        	                        $(_this).children('.dropdown-content-item-list').css('top', (i - h));
        	                    } else {
        	                        $(_this).children('.dropdown-content-item-list').css('top', (i - h) + 1);
        	                    }
        	                } else {
        	                    if (s > h) {												//判断子类的显示位置，如果滚动的高度大于所有分类列表容器的高度
        	                        if (i - s > 0) {											//则 继续判断当前滑过容器的位置 是否有一半超出窗口一半在窗口内显示的Bug,
        	                            $(_this).children('.dropdown-content-item-list').css('top', (s - h) + 2);
        	                        } else {
        	                            $(_this).children('.dropdown-content-item-list').css('top', (s - h) - (-(i - s)) + 2);
        	                        }
        	                    } else {
        	                        $(_this).children('.dropdown-content-item-list').css('top', 3);
        	                    }
        	                }*/
        			    	
        			    	var $itemList = $(_this).children('.dropdown-content-item-list');
        			    	//通过position()获取相对父元素的top,元素的最近父元素中必须有设置position的，否则postion()获取的top是相对窗口的
        			    	$itemList.css('top', $(_this).position().top);
        			    	
        			    	//当commonselect太靠近窗口右边时,item列表改变显示方向
        	    	    	var popupWidth = $itemList.width() + $commonselect.$dropdownContent.width();
        	    	    	var availableWidth = $(window).width() - $commonselect.$dropdownContent.offset().left;
        	    	    	//减去10是因为IE获取的实际宽度还是不够用
        	    	    	if(availableWidth - popupWidth > 10){
        	    	    		$itemList.css('left', '');
        	    	    	}else{
        	    	    		$itemList.css('left',  $(_this).position().left - $itemList.width());
        	    	    	}
        			    	  
        	                $(_this).addClass('hover');
        	                $(_this).children('.dropdown-content-item-list').css('display', 'block');
        	                $commonselect.$dropdown.show();
        			    }, 
        			    outEvent: function(){ 
        			    	 $(_this).removeClass('hover');
        		             $(_this).children('.dropdown-content-item-list').css('display', 'none');
        					 //因为加入hover延迟,不能再此次隐藏
        		             //$commonselect.$dropdown.hide();
        			    }
        		  }); 
        	});
        	
            // select
            $commonselect.find(".dropdown-content-subitem a").off("click").on("click", function (event, silent) {
                $(this).toggleClass("selected");

                var text = $(this).text();
                var item = new Object();
                item[$commonselect.settings.valueField] = $(this).attr("code");
                item[$commonselect.settings.labelField] = text;
                
                var isFun = $.isFunction($commonselect.settings.onBeforeSelect);
                // onBeforeSelect
                if (isFun) {
                    $commonselect.settings.onBeforeSelect.apply(this, [item]);
                }
                
                if ($(this).hasClass('selected')){
                    $commonselect._inputContainerControl.addItem(item);
                }else{
                	$commonselect._inputContainerControl.removeItem(item);
                }
                
                var isOnAfterSelectFun = $.isFunction($commonselect.settings.onAfterSelect);
                // onAfterSelect
                if (isOnAfterSelectFun) {
                    $commonselect.settings.onAfterSelect.apply(this, [item]);
                }

                //$commonselect.$dropdown.hide();
                if(!silent && $commonselect.settings.onChange){
                	 var oper = "";
                     if($(this).hasClass('selected')){
                     	oper = "add";
                     }else{
                     	oper = "remove";
                     }
                     $commonselect.settings.onChange.apply($commonselect, [[item], oper, $commonselect._inputContainerControl.getSelectedItems()]);
                }
            });

            // close handle
            $commonselect.find('.dropdown-content-item > .dropdown-content-item-list > .dropdown-content-item-close').click(function () {
                $(this).parent().parent().removeClass('hover');
                $(this).parent().hide();
            });

            richDropDown();
        }
        
        /**
         * 丰富$commonselect.$dropdown对象,为其增加方法或属性等
         */
        function richDropDown(){
        	/**
        	 * 取消选中项
        	 */
        	$commonselect.$dropdown.unSelectItem = function(item){
        		this.find(".dropdown-content-subitem a.selected").each(function(index, element){
        			 if($(element).attr("code") == item[$commonselect.settings.valueField]){
        				 $(element).removeClass("selected");
        				 return false;
        			 }
        		});
        	};
        	
        	/**
        	 * 选中项
        	 */
        	$commonselect.$dropdown.selectItems = function(items){
        		for(var i = 0, length = items.length; i < length; i++){
        			this.find(".dropdown-content-subitem a[code='"+items[i][$commonselect.settings.valueField]+"']").addClass("selected");
    			}
        	};
        	
        	/**
        	 * 触发事件选中项通过label关键字
        	 * @param values label值数组
        	 * @param silent 是否不触发onchange
        	 */
        	$commonselect.$dropdown.triggerSelectItemsByLabel = function(labels, silent){
        		for(var i = 0, length = labels.length; i < length; i++){
        			this.find(".dropdown-content-subitem a").each(function(index, element){
        				if($(element).text() == labels[i]){
        					$(element).trigger("click", silent);
        					return false;
        				}
        			});
    			}
        	};
        	
        	/**
        	 * 触发事件选中项通过value关键字
        	 * @param values code值数组
        	 * @param silent 是否不触发onchange
        	 */
        	$commonselect.$dropdown.triggerSelectItemsByValue = function(values, silent){
        		for(var i = 0, length = values.length; i < length; i++){
        			this.find(".dropdown-content-subitem a[code='"+values[i]+"']").trigger("click", silent);
    			}
        	};
        	
        	/**
        	 * 下拉列表中的值初始化
        	 */
        	$commonselect.$dropdown.initValue = function(value){
        	    //#1 设置所有非选中
        		this.find(".dropdown-content-subitem a.selected").each(function(index, element){
       				 $(element).removeClass("selected");
       		    });
        		
        		if($.isArray(value)){
        			$commonselect.$dropdown.selectItems(value);
        		}else{
        			var valueArray = [];
        			if($commonselect.settings.delimiter){
        				valueArray = value.split($commonselect.settings.delimiter);
        			}else{
        				valueArray = value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER);
        			}
        			
        			if($commonselect.settings.saveType == "c"){
            			$commonselect.$dropdown.triggerSelectItemsByValue(valueArray, true);
            		}else{
            			$commonselect.$dropdown.triggerSelectItemsByLabel(valueArray, true);
            		}
        		}
        	};
        	
        	//下拉列表没有构建时,可能会存在初始化设置,当构建时需要初始化值
        	if($commonselect.data("$tempInitValue")){
        		var value = $commonselect.data("$tempInitValue");
        		$commonselect.removeData("$tempInitValue");
        		
        		$commonselect.$dropdown.initValue(value);
        	}
        }

        /**
         * Get level data,Should support ajax lazy data and already load data
         * @param level
         */
        function getDataByParent(pid) {
            var array = new Array();
            if ($commonselect.settings.ajaxMode) {
                // Yep,ajax mode
            } else {
                $.each($commonselect.settings.internalData, function () {
                    var p = $(this).attr($commonselect.settings.parentField);
                    if (p == pid) {
                        array.push($(this));
                    }
                });
            }
            return array;
        }

        /**
         * Build area dropdown content
         */
        function buildDropdown(completeCallBack) {
            // validate data
            $commonselect.$dropdown = $('<span class="commonselect-dropdown"></span>');
            $commonselect.$dropdownContent = $('<div class="commonselect-dropdown-content"></div>');

            if ($commonselect.settings.url) {
                var postData = {};
                $.extend(postData, $commonselect.settings.otherRequestParam || {});
                
                $.ajax({
                    url: $commonselect.settings.url,
                    data: JSON.stringify(postData),//JSON.stringify(postData),
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    beforeSend: function (xhr) {
                        if ($commonselect.settings.beforeSend) {
                            $commonselect.settings.beforeSend.apply(this, [xhr]);
                        }
                    },
                    complete: function (XHR, TS) {
                        if ($commonselect.settings.complete) {
                            var completeArgs = new Array();
                            completeArgs.push(XHR);
                            completeArgs.push(TS);
                            $commonselect.settings.complete.apply(this, completeArgs);
                        }
                    },
                    success: function (res) {
                        $commonselect.settings.data = res;
                        convertDataToInternalData();
                        buildContent();
                        if(completeCallBack && $.isFunction(completeCallBack)){
            		    	completeCallBack();
                    	}
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        var e = new Object();
                        e.code = XMLHttpRequest.status;
                        e.msg = $.sberror.format(e.code, this.url);
                        // 根据规范要求将错误交给全局函数处理
                        $.sberror.onError(e);
                    }
                });
            } else {
            	convertDataToInternalData();
                buildContent();
                if(completeCallBack && $.isFunction(completeCallBack)){
    		    	completeCallBack();
            	}
            }

        }

        /**
         * 将原始格式转换为满足组件需要的格式数据 <br>
         * 如：
         *   [
         *     {"pId":"0","id":"1", "code":"141","detail":"电脑"},
         *     {"pId":"0","id":"1", "code":"142","detail":"手机"}
         *     {"pId":"0","id":"2", "code":"11","detail":"电子书"}
         *   ]
         *   转换为：
         *   [{"pId":"0","id":"1","items":[{"code":"141","detail":"电脑"},{"code":"142","detail":"手机"}]},
         *    {"pId":"0","id":"2","item": {"code":"11","detail":"电子书"}}
         *   ]
         */
        function convertDataToInternalData(){
        	var data = $commonselect.settings.data;
        	if(data == null || data == undefined){
        		$commonselect.settings.internalData = [];
        		return;
        	}
        	
        	var internalData = [];
        	for(var i = 0, length = data.length; i < length; i++){
        		var addData = data[i];
        		
        		var newItem = new Object();
        		newItem[$commonselect.settings.valueField] = addData[$commonselect.settings.valueField];
        		newItem[$commonselect.settings.labelField] = addData[$commonselect.settings.labelField];
         	    
        		var newId = addData[$commonselect.settings.idField];
        		var newParent = addData[$commonselect.settings.parentField];
        		//组件逻辑是只有根节点的子节点才有存在items属性,如果逻辑变更需要修改此处,参见buildLevel方法
        		if(internalData.length > 0 && newParent == $commonselect.settings.rootId){
        			var internalLength = internalData.length;
        			for(var internalI = 0; internalI < internalLength; internalI++){
            	    	var internalDataItem = internalData[internalI];
            	    	if(internalDataItem[$commonselect.settings.idField] == newId){
            	    		if(internalDataItem.items === undefined){
            	    			internalDataItem.items  = [];
            	    			internalDataItem.items.push(internalDataItem.item);
            	    			internalDataItem.items.push(newItem);
            	    			delete internalDataItem.item;
            	    		}else{
            	    			internalDataItem.items.push(newItem);
            	    		}
            	    		break;
            	    	}
            	    	if(internalI == internalData.length - 1){
            	    		internalData.push(internalData.push(getInternalDataItem(newParent, newId, newItem)));
            	    	}
            	    }
        		}else{
    	    		internalData.push(getInternalDataItem(newParent, newId, newItem));
        		}
        	}
        	$commonselect.settings.internalData = internalData;
        }
        
        function getInternalDataItem(parent, id, item){
    		var dataItem = {};
    		dataItem[$commonselect.settings.parentField] = parent;
     	    dataItem[$commonselect.settings.idField] = id;
     	    dataItem.item = item;
     	    return dataItem;
    	}
        
        /**
         * Build common select content
         */
        function buildContent() {
            // build item
            var firstLevelData = getDataByParent($commonselect.settings.rootId);
            var html = buildLevel(1, firstLevelData);

            $commonselect.$dropdownContent.append(html);
            // final
            $commonselect.$dropdown.append($commonselect.$dropdownContent);
            $commonselect.append($commonselect.$dropdown);

            afterBuildDropdown();
        }

        /**
         * Build diffirent level construction
         * @param level
         */
        function buildLevel(level, array) {
            level = parseInt(level);
            var html = "";
            if (level == 1) {
                $.each(array, function (idx) {
                    html += '<div class="dropdown-content-item"><h3><span>·</span>';
                    var item = $(this).attr('item');
                    if (item) {
                        html += $('<div>').append($('<a href="javascript:void(0);"></a>').text($(item).attr($commonselect.settings.labelField))).remove().html();
                    } else {
                        // items
                        var items = $(this).attr('items');
                        $.each(items, function (idx) {
                            if (idx > 0) {
                                html += '、';
                            }
                            html += $('<div>').append($('<a href="javascript:void(0);"></a>').text($(this).attr($commonselect.settings.labelField))).remove().html();
                        });
                    }
                    html += '</h3></div>';
                    var children = getDataByParent($(this).attr('id'));
                    var childrenHtml = "";
                    if (children && children.length > 0) {
                        childrenHtml += buildLevel(level + 1, children);
                    }
                    if (childrenHtml.length > 0) {
                        var $html = $(html);
                        $html.find('h3').eq(idx).after(childrenHtml);
                        html = $("<div></div>").append($html.clone()).html();
                    }
                });

            } else if (level == 2) {
                html += '<div class="clearfix dropdown-content-item-list">' +
                        //'<div class="dropdown-content-item-close">x</div>'+
                    '<div class="dropdown-content-subitem">';
                var tempHtml = "";
                $.each(array, function (idx) {
                	var item = $(this).attr('item');
                    var $dl = $("<dl></dl>").attr("id", $(this).attr($commonselect.settings.idField)).append("<dt></dt>");
                    $dl.children("dt").append($('<a href="javascript:void(0);"></a>').attr("code", $(item).attr($commonselect.settings.valueField)).text($(item).attr($commonselect.settings.labelField)));
                    tempHtml += $("<div>").append($dl).remove().html();
                   
                    var children = getDataByParent($(this).attr('id'));
                    var childrenHtml = "";
                    if (children && children.length > 0) {
                       childrenHtml += buildLevel(level + 1, children);
                    }
                    if (childrenHtml.length > 0) {
                        var $tempHtml = $(tempHtml);
                        $tempHtml.filter('dl').eq(idx).append(childrenHtml);
                        tempHtml = $("<div></div>").append($tempHtml.clone()).html();
                    }
                });
                html += tempHtml;
                // 有可能加上右边自定义文本之类的使用dropdown-content-cat-right
                html += '</div></div>';
            } else if (level == 3) {
                html += "<dd>";
                $.each(array, function () {
                    var $item = $(this).attr('item');
                    html += $("<div>").append($('<em></em>').append($('<a href="javascript:void(0);"></a>')
                    		                                         .attr("code", $($item).attr($commonselect.settings.valueField))
                    		                                         .text($($item).attr($commonselect.settings.labelField)))).remove().html();
                });
                html += "</dd>";
            } else {
                // unsupported operation
                throw  "仅支持3层数据 <- Unsupported operation";
            }

            return html;
        }


        /**
         * enabled or disabled class
         */
        function toggleDisabledClass(flag) {
            if (flag) {
                $commonselect.$input.addClass('input-disabled');
            } else {
                $commonselect.$input.removeClass('input-disabled');
            }
        }

        /**
         * Main function
         */
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Commontree:普通的树控件
 * 
 * Dependency:jquery.ztree.all-3.5.js,jquery.ztree.exhide-3.5.js,sinobest.tools.js,sinobest-treetools.js
 */
(function ($) {
	
	var defaults = {
		 name:null,
	     className:"sinobest-commontree",
	     data:null,
	     url:null,
	     onAjaxRequest: null, 
		 onAjaxResponse: null,
		 onInitComplete:null,
		 expandAll:false,
		 style:null,
		 
	     setting: {
 			data: {
				simpleData: {
					enable: true,
					idKey: "id",
					pIdKey: "pId",
					rootPId: 0
				}
			}
	     }
	};

    $.fn.sbcommontree = function (options) {
    	var settings;
        var $sbcommontree = this;
        if (isContain()) {
            if (options) {
                settings = $.extend(true, {}, getter().settings, options || {});
            } else {
                return getter();
            }
        } else {
            settings = $.extend(true, {}, defaults, options || {});
        }

        $sbcommontree.settings = settings;
    
        function getter() {
            return $sbcommontree.data("$sbcommontree");
        }

        function setter() {
        	$sbcommontree.data("$sbcommontree", $sbcommontree);
        }

        function isContain() {
            return $sbcommontree.data("$sbcommontree");
        }
        
        $.sbbase.mixinWidget($sbcommontree, {isAddValueMethod:false});
        
        $sbcommontree.getTreeObj = function(){
        	return $.fn.zTree.getZTreeObj($sbcommontree.attr("id"));
        };
        
        $sbcommontree.setState = function(stateJson){
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    $sbcommontree.attr(k, v);
                } else {
                	$sbcommontree.removeAttr(k);
                }
            });
            return $sbcommontree;
        };
		
        $sbcommontree.getDefaultOptions = function(){
        	return defaults;
        };
        
        $sbcommontree.reload = function(){
        	$sbcommontree.empty();
        	
        	var orignalAttributes = $sbcommontree.data("orignalAttributes");
        	var currentAttributes = $sbcommontree.getState();
        	$.each(currentAttributes, function (k, v) {
                if (orignalAttributes[k]) {
                   var orignalValue = orignalAttributes[k];
                   if(orignalValue !== v){
                	   $sbcommontree.attr(k, orignalValue);
                   }
                }else {
                   $sbcommontree.removeAttr(k);
                }
            });

        	$.sbtools.initController.removeInitCompleteFlag($sbcommontree, "$sbcommontree");
        	render();
        };
        
        $sbcommontree.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		$sbcommontree.settings.data= null;
        		$sbcommontree.settings.url = null;
        		
       		    if($.isArray(dataSource)){
       		    	$sbcommontree.settings.data = dataSource;
       		    }else{
       		    	$sbcommontree.settings.url = dataSource;
       		    }
       		    $sbcommontree.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };
        
        $sbcommontree.getName = function(){
            return $sbcommontree.settings.name;	
        };
        
        function initComplete(){
            $.sbtools.initController.initComplete($sbcommontree, "$sbcommontree", function(){
                if(!isContain()){
                    setter();
                }
            }, $sbcommontree.settings.onInitComplete);
        }
        
        function render() {
        	var orignalAttributes = $sbcommontree.getState();
        	$sbcommontree.data("orignalAttributes", orignalAttributes);

        	$sbcommontree.addClass("ztree").addClass($sbcommontree.settings.className);
        	$sbcommontree.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
        	
        	if($sbcommontree.settings.style){
        		$sbcommontree.attr("style", $sbcommontree.settings.style);
        	}
        	
        	if($sbcommontree.settings.name) {
        		$sbcommontree.attr("name", $sbcommontree.settings.name);
			}
        	
            if($sbcommontree.settings.data){
            	initForLocalData();
            }else if(isAsyncLoad()){
            	initForAsync();
            }else if($sbcommontree.settings.url){
            	initForUrlData();
            }else{
            	throw new Error("未配置tree初始化数据来源");
            }
            
        	setter();
        	
            return $sbcommontree;
        }
        
        function initForLocalData(){
        	initTree($sbcommontree.settings.data);
        }
        
        function initTree(nodes){
        	$.fn.zTree.init($sbcommontree, $sbcommontree.settings.setting, nodes);
        	
        	if($sbcommontree.settings.expandAll){
        		$sbcommontree.getTreeObj().expandAll(true);
			}
        	
        	initComplete();
        }
        
        function isAsyncLoad(){
        	return ($sbcommontree.settings.setting.async && $sbcommontree.settings.setting.async.enable);
        }
        
        function initForUrlData(){
        	 var request = {};
             if($sbcommontree.settings.onAjaxRequest && $.isFunction($sbcommontree.settings.onAjaxRequest)){
    			  request = ($sbcommontree.settings.onAjaxRequest)(request);
		     }
               
    		 $.ajax({type:"post",
    	             contentType:"application/json; charset=utf-8",
    	             dataType:"json",
    	             data:JSON.stringify(request),
    	             url:$sbcommontree.settings.url,
    	             success:function (treeResponse) {
    	               if($sbcommontree.settings.onAjaxResponse 
    	            		    && $.isFunction($sbcommontree.settings.onAjaxResponse)){
    	            	 treeResponse = ($sbcommontree.settings.onAjaxResponse)(treeResponse);
    	    		   }
    	    		   initTree(treeResponse.treeNodes);
    	            },
    	            error:function (XMLHttpRequest, textStatus, errorThrown) {
    	                var e = {};
    	                e.code = XMLHttpRequest.status;
    	                e.msg = $.sberror.format(e.code, this.url);
    	                $.sberror.onError(e);
    	            }
    	    }); 
        }
        
        function initForAsync(){
        	initTree([]);
        }
        
        return this.each(function () {
            render();
        });
        
    };
    
   
})(jQuery);/**
 * Sinobest-Date:日期组件
 * 
 * Dependency:WdatePicker.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className:"sinobest-date", 
        required:false,
        readonly:false,
        skin:'blueFresh',
        isShowWeek:false,
        isShowClear:true,
        firstDayOfWeek:7,
        dateFormat:"yyyy-MM-dd",
        minDate:null,
        maxDate:null,
        onpicked:null,
        onpicking:null,
        onclearing:null,
        oncleared:null,
        callback:null,
        value:null,
        editable:true,
        onInitComplete:null
    };

    $.fn.sbdate = function (options) {
        var settings;
        var $date = this;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $date.settings = settings;

        function getter() {
            return $date.data("$date");
        }

        function setter() {
            $date.data("$date", $date);
        }
        
        function isContain() {
            return $date.data("$date");
        }

        $.sbbase.mixinWidget($date);
        
        $date.getValue = function () {
            return $date.val();
        };
        $date.setValue = function (v) {
             $date.val(v);
             $date.settings.value = v;
             return $date;
        };

        $date.getName = function () {
            return $date.attr("name");
        };

        $date.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    if (k == 'value') {
                        $date.setValue(v);
                    } else {
                        if (k == 'required') {
                            $date.settings.required = v;
                        } else if (k == 'readonly') {
                            $date.settings.readonly = v;
                            $.sbtools.toggleDateReadonlyClass($date, v);
                        } else{
                        	$date.settings[k] = v;
                        }
                        $date.attr(k, v);
                    }
                } else {
                    $date.removeAttr(k);
                }
            });
            return $date;
        };
		
        $date.getDefaultOptions = function(){
        	return defaults;
        };
        
        $date.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($date, "$sbdate");
            render();
        };

        $date.validate = function () {
            var isFunc = $.isFunction($date.settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                var v = $date.getValue();
                var isOk = false;

                if ($date.settings.required) {
                    isOk = $.sbvalidator.required($date[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };

        function initComplete(){
            $.sbtools.initController.initComplete($date, "$sbdate", function(){
                if(!isContain()){
                    setter();
                }
            }, $date.settings.onInitComplete);
        }
        
        function render() {
        	$date.addClass($.sbtools.CONSTANTS.UICLASS.TEXT_COMMON);
            $date.addClass($date.settings.className).addClass('Wdate');
            $date.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            $date.attr('readonly', $date.settings.readonly);
            $.sbtools.toggleDateReadonlyClass($date, $date.settings.readonly);
            
            $date.attr('required', $date.settings.required);
            
            if($date.settings.value !== undefined && $date.settings.value !== null) {
                $date.setValue($date.settings.value);
            }

            //单击日期的时候,虽然控件已经获取焦点,有可能没触发focus事件
            $date.off('click.sbdate').on('click.sbdate', function(){
          	    if($date.settings.readonly){
 	    		    return;
 	    	    }
          	    if($date.is(":focus")){
          		    return;
          	    }
          	    $date.focus();
            });
          
            //缺陷编号：Q150262000050
            //因为输入不合法日期,会弹出提示框,点击【取消】后,在点击其他日期控件输入错误日期不验证的bug
            //注:如果日期控件不提供不合法日期的弹出提示框的功能，此处代码没有任何作用
            $date.off('blur.sbdate').on('blur.sbdate', function(){
            	if($date.ignoreBlur){
            		return;
            	}
            	
          	    if($date.hasClass("WdateFmtErr")){
          		    $date.ignoreFocus = true;
          		    $date.focus();
          		    $date.ignoreFocus = false;
          	    }
            });
            
            adjustDatePopupLayerPosition();
            
            //click的时候更改settings,日期控件不能更改设置,而配置focus则可以
            $date.off('focus.sbdate').on('focus.sbdate', function () {
            	if($date.ignoreFocus){
            		return;
            	}
            	
            	if($date.settings.readonly){
  	    		   return;
  	    	    }
            	
            	//缺陷编号：Q150262000050
            	//因为输入不合法日期,会弹出提示框,点击【确定】后,在点击其他日期控件输入错误日期不验证的bug
                //注:如果日期控件不提供不合法日期的弹出提示框的功能，此处代码没有任何作用
            	if($dp !== undefined && $dp !== null){
        			 if($dp.dd !== undefined && $dp.dd !== null && $dp.el !== undefined && $dp.el !== null){
        				   if($dp.el.id !== undefined && $dp.el.id !== null){
        						if($($dp.dd).is(":visible")){
        							 if($dp.el.id !== $date.attr("id")){
        								 $date.ignoreBlur = true;
        								 $date.blur();
        								 $date.ignoreBlur = false;
        							 }
                 		        }
        				   }
        			 }
        		}
            	 
                var initJson = {
                    skin:$date.settings.skin,
                    firstDayOfWeek:$date.settings.firstDayOfWeek,
                    isShowClear:$date.settings.isShowClear,
                    isShowWeek:$date.settings.isShowWeek,
                    dateFmt:$date.settings.dateFormat,
                    onpicked:$date.settings.onpicked,
                    onpicking:$date.settings.onpicking,
                    onclearing:$date.settings.onclearing,
                    oncleared:$date.settings.oncleared
                };

                if ($date.settings.maxDate) {
                    initJson = $.extend({}, initJson, {maxDate:$date.settings.maxDate});
                }
                if ($date.settings.minDate) {
                    initJson = $.extend({}, initJson, {minDate:$date.settings.minDate});
                }
                initJson = $.extend({}, initJson, {readOnly:$date.settings.readonly});

                //是否允许直接编辑日期控件输入框
                if(!$date.settings.editable){
                	initJson = $.extend({}, initJson, {readOnly:true});
                }
                
                WdatePicker(initJson);
                
                adjustMouseRightClickEffect();
            });
            
            initComplete();
            setter();
        }

        /**
         * 解决在My97DatePicker上面鼠标右击的时候弹出界面提示信息不友好的问题
         */
        function adjustMouseRightClickEffect(){
        	 $("iframe").each(function(index, iframeElement){
             	$(iframeElement).load(function() {
             		  
                		  $(iframeElement.contentWindow.document).on("mouseup", function(e){
                			  if(3 != e.which){
             		    	     return;
             		          }
                			
                		      if($(iframeElement.contentWindow.document).find("div.WdateDiv").length <= 0){
                		         $(iframeElement.contentWindow.document).off("mouseup");
                		    	 return;
                		      }
                		      
                		      //My97DatePicker有些操作是延时的
                		      setTimeout(function(){
                		    	  $(iframeElement.contentWindow.document).find("table.WdayTable").find("a").each(function(index, element){
  		        		                if($(element).html() == "My97 DatePicker"){
  		        		    	              $(element).closest("div").html("快速选择");
  		        			                  return false;
  		        		                }
  		        	              });
                		    	  
		        	          }, 0.5);
                		      
                	      });
             	});
             	  
             });
        }
        
        //缺陷编号：Q150262000055
        //不是顶层窗口,对于FRAME,若其父元素为不是顶层窗口,则需要注册滚动条事件.
        //对于IFRAME都需要注册滚动条事件.事件中处理滚动条滚动时调整日期弹出层的位置
        function adjustDatePopupLayerPosition(){
            if(window !== top &&
            		(self.frameElement && 
            			    ((self.frameElement.tagName === "FRAME" && window.parent !== top)
            				  || self.frameElement.tagName === "IFRAME"))){
            	 $(window).scroll(function(){
                     if($dp !== undefined && $dp !== null){
             			 if($dp.dd !== undefined && $dp.dd !== null && $dp.el !== undefined && $dp.el !== null){
             				   if($dp.el.id !== undefined && $dp.el.id !== null){
             						if($($dp.dd).is(":visible") || $($dp.dd).data("scrollHidden")){
             							 if($dp.el.id === $date.attr("id")){
             								var iframePosition =   getIframeRelativeTopPosition(window, 0);
             								var notTopParentsScrollTop = getNotTopParentsScrollTop(window, 0);
             			 
             								var dateDivTop = iframePosition.top + $date.offset().top + $date.outerHeight(true) - notTopParentsScrollTop - $(window).scrollTop();
             								
             								var isUnder =  isUnderIframeTop(dateDivTop,  iframePosition.top, notTopParentsScrollTop);
             								var isExceed = isExceedIframeBottom(window, dateDivTop, iframePosition.top, notTopParentsScrollTop);
             						 
             								if(isUnder || isExceed || isExceedParentWindowRegion(window, dateDivTop)){
             									$($dp.dd).data("scrollHidden", true);
             									$dp.hide();
             								}else{
             									if($($dp.dd).data("scrollHidden")){
             										$dp.show();
             										$($dp.dd).removeData("scrollHidden");
             									}
             									$($dp.dd).css({top:dateDivTop});
             								}
             							 }
                      		       }
             				   }
             			 }
             		   }
                  });
            }
        }
        
        /**
         * 获取iframe相对top窗口的位置
         */
        function getIframeRelativeTopPosition(currentIframeWindow, superiorIframeTop){
        	var iframeElement = currentIframeWindow.frameElement;
        	if(iframeElement){
        		var offsetTop = $(iframeElement).offset().top || 0;
        		
        		if(isTopWindow(currentIframeWindow.parent)){
            		return {top: offsetTop + superiorIframeTop};
            	}else{
            		return getIframeRelativeTopPosition(currentIframeWindow.parent, offsetTop);
            	}
        	}
        	return 0;
        }
        
        /**
         * 是否最顶层窗口.
         * 注:当frame布局的时候,日期弹出层位于frame中,frame就是顶层窗口
         */
        function isTopWindow(currentWindow){
        	if(currentWindow === top
   				 || (currentWindow.frameElement
   	       				   && currentWindow.frameElement.tagName === "FRAME"
   	       				   && currentWindow.parent === top)){
        		return true;
        	}
        	return false;
        }
        
        /**
         * 获取iframe所有父窗口的滚动条的scrollTop的和值,但是不包含最顶层窗口的滚动条,因为日期弹出层就位于最顶层中
         */
        function getNotTopParentsScrollTop(currentIframeWindow, scrollTop){
        	if(isTopWindow(currentIframeWindow.parent)){
            	return scrollTop;
            }else{
            	return getNotTopParentsScrollTop(currentIframeWindow.parent,  ($(currentIframeWindow.parent).scrollTop() || 0) + scrollTop);
            }
       }
        
       
       /**
        * 是否低于iframe的top
        */
       function isUnderIframeTop(dateDivTop, iframeTop, notTopParentsScrollTop){
        	return (dateDivTop < (iframeTop - notTopParentsScrollTop));
        }
        
        /**
         * 是否高于iframe的最底部
         */
        function isExceedIframeBottom(currentWindow, dateDivTop, iframeTop, notTopParentsScrollTop){
        	//(iframeTop - notTopParentsScrollTop)表示当前实际的位置
        	return (dateDivTop > (iframeTop - notTopParentsScrollTop) + getIframeClientHeight(currentWindow));
        }
        
        /**
         * 是否超过父窗口的范围
         */
        function isExceedParentWindowRegion(currentWindow, dateDivTop){
        	var iframePosition =   getIframeRelativeTopPosition(currentWindow.parent, 0);
		    var notTopParentsScrollTop = getNotTopParentsScrollTop(currentWindow.parent, 0);
		    
		    if(isUnderIframeTop(dateDivTop, iframePosition.top, notTopParentsScrollTop)){
		    	return true;
		    }
		    
		    if(isExceedIframeBottom(currentWindow.parent, dateDivTop, iframePosition.top, notTopParentsScrollTop)){
		    	return true;
		    }
		    
		    return false;
        }
        
        /**
         * 获取当前iframe的高度
         */
        function getIframeClientHeight(currentIframeWindow){
        	if(currentIframeWindow.frameElement){
        		return $(currentIframeWindow.frameElement).outerHeight(true);
        	}
         	return 0;
        }
        
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Daterange:日期范围组件
 * 
 * Dependency:WdatePicker.js,sinobest.date.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-daterange",
        required: false,
        readonly: false,
        beginMinDate: null,
        beginMaxDate: null,
        endMinDate: null,
        endMaxDate: null,
        dateFormat:"yyyy-MM-dd",
        name: "",
        id: "",
        delimiter: null,
        beginSuffix: "_begin",
        endSuffix: "_end",
        callback: null,
        toChar: "\u81f3", // 至
        value: [], //数组，有顺序
        validateMode:"whole",   // whole:整体   part:部分
        beginName:null,
        endName:null,
        onInitComplete:null
    };

    $.fn.sbdaterange = function (options) {
        var settings;
        var $daterange = this;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
            	
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }

        $daterange.settings = settings;

        function getter() {
            return $daterange.data("$daterange");
        }

        function setter() {
            $daterange.data("$daterange", $daterange);
        }
        
        function isContain() {
            return $daterange.data("$daterange");
        }

        $.sbbase.mixinWidget($daterange);
        
        /**
         * Get value
         */
        $daterange.getValue = function () {
            var values = [$daterange.$begin.getValue(), $daterange.$end.getValue()];
            if ($daterange.settings.delimiter) {
                return values.join($daterange.settings.delimiter);
            } else {
                return values;
            }
        };
        /**
         * Set value
         */
        $daterange.setValue = function (array) {
            if ($.isArray(array)) {
                $daterange.$begin.setValue(array[0]);
                $daterange.$end.setValue(array[1]);
            }else{
               	 $daterange.$begin.setValue('');
                 $daterange.$end.setValue('');
            }
            $daterange.settings.value = array;
            return $daterange;
        };

        $daterange.getName = function(){
            var names = [$daterange.$begin.getName(), $daterange.$end.getName()];
            if ($daterange.settings.delimiter) {
                return names.join($daterange.settings.delimiter);
            } else {
                return names;
            }
        };

        /**
         * Set DateRange state
         * @param stateJson
         * @return {*}
         */
        $daterange.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    if (k == 'value') {
                        $daterange.setValue(v);
                    } else {
                        if (k == 'required') {
                            $daterange.settings.required = v;
                        } else if (k == 'readonly') {
                            $daterange.settings.readonly = v;
                            $daterange.$begin.setState({"readonly": v});
                            $daterange.$end.setState({"readonly": v});
                        }else{
                        	if(k == "beginMinDate"){
                        		$daterange.$begin.setState({"minDate": v});
                        	}else if(k == "beginMaxDate"){
                        		$daterange.$begin.setState({"maxDate": v});
                        	}else if(k == "endMinDate"){
                        		$daterange.$end.setState({"minDate": v});
                        	}else if(k == "endMaxDate"){
                        		$daterange.$end.setState({"maxDate": v});
                        	}
                        }
                        $daterange.attr(k, v);
                    }
                } else {
                    $daterange.removeAttr(k);
                }
            });
            return $daterange;
        };
		
        $daterange.getDefaultOptions = function(){
        	return defaults;
        };
        
        /**
         * Reload
         */
        $daterange.reload = function () {
        	$daterange.empty();
        	$.sbtools.initController.removeInitCompleteFlag($daterange, "$sbdaterange");
            render();
        };
         
        /**
         * Validate
         * @return {*}
         */
        $daterange.validate = function () {
        	if($daterange.settings.validateMode == "part"){
        		var msgs = [$daterange.$begin.validate(), $daterange.$end.validate()];
                if ($daterange.settings.delimiter) {
                    return msgs.join($daterange.settings.delimiter);
                } else {
                    return msgs;
                }
        	}else if($daterange.settings.validateMode == "whole"){
        		var beginResult = $daterange.$begin.validate();
                if($.sbtools.isNotBlank(beginResult)){
                	return beginResult;
                }
                
                var endResult = $daterange.$end.validate();
                if($.sbtools.isNotBlank(endResult)){
                	return endResult;
                }
                return "";
        	}else{
        		throw new Error("validateMode is undefined");
        	}
        };

        /**
         * Build input element
         */
        function buildInput() {
            var beginName = "";
            if($daterange.settings.beginName){
            	beginName = $daterange.settings.beginName;
            }else{
            	beginName = $daterange.settings.name + $daterange.settings.beginSuffix;
            }
            
            var endName = "";
            if($daterange.settings.endName){
            	endName = $daterange.settings.endName;
            }else{
            	endName = $daterange.settings.name + $daterange.settings.endSuffix;
            }
            
            
            var beginId;
            var endId;
            if ($daterange.settings.id) {
                beginId = $daterange.settings.id + $daterange.settings.beginSuffix;
                endId = $daterange.settings.id + $daterange.settings.endSuffix;
            } else {
                beginId = beginName;
                endId = endName;
            }
            
            var $container = $('<div class="sinobest-daterange-container sinob-widget-container"></div>');
            var $containerContent = $('<table width="100%" border="0" cellspacing="0" cellpadding="0"></table>');
            var $content = $("<tr></tr>");
            var $tdBegin = $('<td><input type="text"/></td>');
            $tdBegin.find("input").attr("name", beginName);
            $tdBegin.find("input").attr("id", beginId);
			
			var $tdTo = $('<td class="sinobest-daterange-to"></td>');
			$tdTo.text($daterange.settings.toChar);
			
            var $tdEnd = $('<td><input type="text"/></td>');
            $tdEnd.find("input").attr("name", endName);
            $tdEnd.find("input").attr("id", endId);
            $content.append($tdBegin).append($tdTo).append($tdEnd);
            
            $containerContent.append($content);
            $container.append($containerContent);
            $daterange.append($container);
        };

        function initComplete(){
            $.sbtools.initController.initComplete($daterange, "$sbdaterange", function(){
                if(!isContain()){
                    setter();
                }
            }, $daterange.settings.onInitComplete);
        }
        
        /**
         * Render function
         */
        function render() {
            $daterange.addClass($daterange.settings.className);
            $daterange.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            buildInput();
            var beginId;
            $daterange.find("input").each(function (idx) {
                if (idx == 0) {
                    // 覆盖value
                    var beginSettings = $.extend({}, $daterange.settings, {value: $daterange.settings.value[idx],onInitComplete:null});

                    if ($daterange.settings.beginMinDate) {
                        beginSettings = $.extend({}, beginSettings, {minDate: $daterange.settings.beginMinDate});
                    }
                    if ($daterange.settings.beginMaxDate) {
                        beginSettings = $.extend({}, beginSettings, {maxDate: $daterange.settings.beginMaxDate});
                    } else {
                        var endId = $daterange.find("input").eq(1).attr('id');
                        beginSettings = $.extend({}, beginSettings, {maxDate: "#F{$dp.$D(\'" + endId + "\')}"});
                    }
                     
                    $daterange.$begin = $(this).sbdate(beginSettings);
                    $(this).removeClass(defaults.className);
                    $(this).removeClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
                    $(this).addClass("sinobest-daterange-input sinobest-daterange-begin");
                    beginId = $(this).attr('id');
                } else {
                    var endSettings = $.extend({}, $daterange.settings, {value: $daterange.settings.value[idx],onInitComplete:null});

                    if ($daterange.settings.endMinDate) {
                        endSettings = $.extend({}, endSettings, {minDate: $daterange.settings.endMinDate});
                    } else {
                        endSettings = $.extend({}, endSettings, {minDate: "#F{$dp.$D(\'" + beginId + "\')}"});
                    }
                    if ($daterange.settings.endMaxDate) {
                        endSettings = $.extend({}, endSettings, {maxDate: $daterange.settings.endMaxDate});
                    }
                    $daterange.$end = $(this).sbdate(endSettings);
                    $(this).removeClass(defaults.className);
                    $(this).removeClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
                    $(this).addClass("sinobest-daterange-input sinobest-daterange-end");
                }
            });

            initComplete();
            setter();
        }

        render();
        return this;
    };
})(jQuery);
/**
 * Sinobest-Dialog:对话框组件
 * 
 * Dependency:dialog-plus.js,sinobest.tools.js
 */
(function ($) {
    $.extend({
        sbdialog: function (options) {
            var defaults = {
                containerId: null,
                content: null, // 设置content之后，会覆盖container的内容
                url: null,  
                className: "sinobest-dialog",
                dialogType: "dialog",
                text: "",
                width: null,
                height: null,
                zIndex: 9999,
                title: null,
                okValue: "确定",
                cancelValue: "取消",
                onOK: function () {
                },
                onCancel: null,
                onClose: null,
                button: null,// 自定义按钮
                backdropBackground:"#a7bea9"
            };
            var settings = $.extend({}, defaults, options || {});

            var dialog = {};
            dialog.instance = null;

            dialog.getValue = function () {
//                if (settings.dialogType == 'modal' || settings.dialogType == 'dialog') {
//                    return $('#' + settings.containerId).html();
//                } else {
//                    return settings.text;
//                }
            };
            dialog.setValue = function (v) {
//                if (settings.dialogType == 'modal' || settings.dialogType == 'dialog') {
//                    settings.content = v;
//                } else {
//                    settings.text = v;
//                }
//                this.reload();
            };

            dialog.getState = function () {
                return $.extend({}, getAttributes());
            };

            dialog.setState = function (stateJson) {
                var ogi = this.instance.node;

                $.each(stateJson, function (k, v) {
                    $(ogi).attr(k, v);
                });
                return  this.instance;
            };
		
			dialog.getClassName = function(){
				return defaults.className;
			};

            dialog.getDom = function () {
//                if (settings.dialogType == 'modal' || settings.dialogType == 'dialog') {
//                    return document.getElementById(settings.containerId);
//                }
                return  this.instance.node;
            };

            dialog.reload = function () {
            	this.instance.close();
                render();
            };
            
            dialog.display = function (b) {
                if (b) {
                    // open
                    if (!this.instance.open) {
                    	 this.instance.show();
                    }
                } else {
                	 this.instance.close();
                }
            };

            /**
             * 销毁方法
             */
            dialog.destroy = function () {
            	 this.instance.remove();
            };
            
            /**
             * 关闭对话框框
             */
            dialog.closeDialog = function(){
            	 this.instance.close();
            };

            function getAttributes() {
            	return $.sbbase.getDomElementAttributes(dialog.instance.node);
            }

            function render() {
            	var instance = null;
                if (settings.dialogType == 'alert') {
                    //$.dialog({content:settings.text});
                    instance = basalDialog({
                        content: settings.text,
                        zIndex: settings.zIndex,
                        width: settings.width,
                        height: settings.height,
                        cancel: false,
                        okValue: settings.okValue,
                        ok: settings.onOK,
                        onclose: settings.onClose
                    });
                    $(instance.node).addClass(settings.className);
                    instance.show();
                } else if (settings.dialogType == 'confirm') {
                    instance = basalDialog({
                        content: settings.text,
                        zIndex: settings.zIndex,
                        width: settings.width,
                        height: settings.height,
                        okValue: settings.okValue,
                        ok: settings.onOK,
                        cancelValue: settings.cancelValue,
                        cancel: settings.onCancel,
                        onclose: settings.onClose
                    });
                    instance.show();
                } else if (settings.dialogType == 'message') {
                    instance = basalDialog({
                        zIndex: settings.zIndex,
                        content: settings.text,
                        width: settings.width,
                        height: settings.height,
                        onclose: settings.onClose
                    });
                    $(instance.node).addClass(settings.className);
                    instance.show();
                    if (settings.autoClose) {
                        setTimeout(function () {
                            instance.close().remove();
                        }, settings.autoClose * 1000);
                    }

                } else if (settings.dialogType == 'modal') {
                    var json = {
                        title: settings.title,
                        zIndex: settings.zIndex,
                        width: settings.width,
                        height: settings.height,
                        button: settings.button,
                        onclose: settings.onClose,
                        backdropBackground:settings.backdropBackground
                    };
                    // 判断是否iframe弹出
                    if (settings.url) {
                    	$.sbtools.isInPseudoProtocolBlackList(settings.url, true);
                        json = $.extend({}, json, {url: settings.url});
                    } else {
                        var content = null;
                        // 是否自定义弹出内容
                        if (settings.content) {
                            content = settings.content;
                        } else {
                            // DOM容器
                            content = $("#" + settings.containerId).html();
                        }
                        json = $.extend({}, json, {content: content});
                    }

                    instance = basalDialog(json);
                    $(instance.node).addClass(settings.className);
                    instance.showModal();
                } else {
                    // handle as dialog
                    var json = {
                        title: settings.title,
                        zIndex: settings.zIndex,
                        width: settings.width,
                        height: settings.height,
                        button: settings.button,
                        onclose: settings.onClose
                    };
                    if (settings.url) {
                    	$.sbtools.isInPseudoProtocolBlackList(settings.url, true);
                        json = $.extend({}, json, {url: settings.url});
                    } else {
                        var content = null;
                        if (settings.content) {
                            content = settings.content;
                        } else {
                            content = $("#" + settings.containerId).html();
                        }
                        json = $.extend({}, json, {content: content});
                    }

                    instance = basalDialog(json);
                    $(instance.node).addClass(settings.className);
                    instance.show();
                }
                dialog.instance = instance;
            }

            render();
            return dialog;
        }

    });
})(jQuery);Array.prototype.indexOf = function (e) {
    for (var i = 0, j; j = this[i]; i++) {
        if (j == e) {
            return i;
        }
    }
    return -1;
};

Array.prototype.lastIndexOf = function (e) {
    for (var i = this.length - 1, j; j = this[i]; i--) {
        if (j == e) {
            return i;
        }
    }
    return -1;
};

String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g,
        function (m, i) {
            return args[i];
        });
};/**
 * Sinobest-Error:组件错误信息处理组件
 * 
 */
(function ($) {
    $.extend({sberror:{ }});
    $.extend($.sberror, {
        onError:function (e) {
            //console.log(e.code+":::::"+ e.msg);
        },
        format:function (status, url) {
            var msg = "";
            switch (status) {
                case 400:
                    msg = this.ERROR_MSG_400.format(url);
                    break;
                case 404:
                    msg = this.ERROR_MSG_404.format(url);
                    break;
                default:
                    msg = this.ERROR_MSG_UNDEFINED.format(url);
            }
            return msg;
        },
        ERROR_MSG_400:"错误的请求地址{0}",
        ERROR_MSG_404:"数据不存在{0}",
        ERROR_MSG_UNDEFINED:"不明原因请求异常{0}"
    });
})(jQuery);/**
 * Sinobest-Fullcalendar:日程控件
 * 
 * Dependency:moment.min.js,fullcalendar.js,lang-all.js,sinobest.base.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className:"sinobest-fullcalendar",
        setting:{
        	lang:"zh-cn"
        },
        onInitComplete:null
    };
    
    $.fn.sbfullcalendar = function(options) {
        var $sbfullcalendar = this;
        var settings;
        if(isContain()){
            if(options){
                settings = $.extend(true, {}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            }else{
                return getter();
            }
        }else{
            settings = $.extend(true, {}, defaults, options || {});
        }

        $sbfullcalendar.settings = settings;

        function getter(){
           return $sbfullcalendar.data("$sbfullcalendar");
        }
        
        function setter(){
        	$sbfullcalendar.data("$sbfullcalendar", $sbfullcalendar);
        }
        
        function isContain(){
            return $sbfullcalendar.data("$sbfullcalendar");
        }
        
        $.sbbase.mixinWidget($sbfullcalendar);

        $sbfullcalendar.getFullCalendar = function(){
        	return $sbfullcalendar;
        };
        
        $sbfullcalendar.setState = function (stateJson) {
        	$.each(stateJson, function (k, v) {
        		$sbfullcalendar.attr(k, v);
            });
            return $sbfullcalendar;
        };
		
        $sbfullcalendar.getDefaultOptions = function(){
        	return defaults;
        };

        $sbfullcalendar.reload = function () {
        	$sbfullcalendar.empty();
        	destroyFullCalendar();
        	$.sbtools.initController.removeInitCompleteFlag($sbfullcalendar, "$sbfullcalendar");
            return render();
        };
        
        $sbfullcalendar.destroy = function () {
        	destroyFullCalendar();
            return $sbfullcalendar.remove();
        };
        
        function destroyFullCalendar(){
        	$sbfullcalendar.getFullCalendar().fullCalendar("destroy");
        }

        function initComplete(){
            $.sbtools.initController.initComplete($sbfullcalendar, "$sbfullcalendar", function(){
                if(!isContain()){
                    setter();
                }
            }, $sbfullcalendar.settings.onInitComplete);
        }

        function render() {
            $sbfullcalendar.addClass($sbfullcalendar.settings.className);
            $sbfullcalendar.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            buildFullCalendar();
            
            initComplete();
            setter();
            return $sbfullcalendar;
        }

        function buildFullCalendar(){
        	$sbfullcalendar.fullCalendar($sbfullcalendar.settings.setting);
        }
        
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Hidden:隐藏域组件
 * 
 * Dependency:sinobest-tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-hidden",
        value: null,
        onInitComplete:null
    };

    $.fn.sbhidden = function (options) {
        var $input = this;
        var settings;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $input.settings = settings;

        function getter() {
            return $input.data("$input");
        }

        function setter() {
            $input.data("$input", $input);
        }
        
        function isContain() {
            return $input.data("$input");
        }
        
        $.sbbase.mixinWidget($input);
        
        /**
         * Get value
         * @return  object
         */
        $input.getValue = function () {
            return $input.val();
        };

        /**
         * Set value
         * @param value new value
         * @return object
         */
        $input.setValue = function (value) {
            $input.val(value);
            $input.settings.value = value;
            return $input;
        };

        /**
         * Set new state
         * @param stateJson state json
         * @return  object
         */
        $input.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    if (k == 'value') {
                        $input.setValue(v);
                    } else {
                        $input.attr(k, v);
                    }
                } else {
                    $input.removeAttr(k);
                }
            });
            return $input;
        };
		
        $input.getDefaultOptions = function(){
        	return defaults;
        };

        /**
         * Reload hidden
         * @return object
         */
        $input.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($input, "$sbinput");
            return render();
        };

        $input.getName = function(){
        	return $input.attr("name");
        };
        
        function initComplete(){
            $.sbtools.initController.initComplete($input, "$sbinput", function(){
                if(!isContain()){
                    setter();
                }
            }, $input.settings.onInitComplete);
        }
        
        /**
         * Init
         */
        function render() {
            $input.addClass($input.settings.className);
            $input.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            if ($input.settings.value !== undefined && $input.settings.value !== null) {
                $input.setValue($input.settings.value);
            }
            
            initComplete();
            setter();
            return $input;
        }

        /**
         * Main function
         */
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Iframetools:iframe操作工具组件
 * 
 */
(function ($) {
	
	$.extend({sbiframetools:{}});
	
    $.extend($.sbiframetools, {
    	
    	/**
    	 * 通过id获取iframe对象
    	 * 
    	 * @param iframeId:iframe对象的id
    	 */
    	getIframeById : function(iframeId){
    		 return $("#" + iframeId)[0];
    	},
    	
    	/**
    	 * 通过name获取iframe对象
    	 * 
    	 * @param iframeName:iframe对象的name
    	 */
    	getIframeByName : function(iframeName){
    		return $("iframe[name='"+iframeName+"']")[0];
    	},
    	
    	/**
    	 * 调用iframe中的方法
    	 * 
    	 * @param iframeObj:iframe对象
    	 * @param mehtodName:方法的名称
    	 * @param args:参数数组
    	 */
    	callIframeMethod : function(iframeObj, methodName, args){
    	     //[comment1]:IE8下args参数未传递,导致无法调用
    		 if(args === null || args === undefined){
    			args = [];
    		 }
    		 return iframeObj.contentWindow[methodName].apply(iframeObj.contentWindow, args);
    	},
    	
    	/**
    	 * 获取iframe中的变量值
    	 * 
    	 * @param iframeObj:iframe对象
    	 * @param varName:变量的名称
    	 */
    	getIframeVarValue : function(iframeObj, varName){
    		return iframeObj.contentWindow[varName];
    	},
    	
    	/**
    	 * 设置iframe中变量的值
    	 * 
    	 * @param iframeObj:iframe对象
    	 * @param varName:变量的名称
    	 * @param varValue:变量的值
    	 */
    	setIframeVarValue : function(iframeObj, varName, varValue){
    		iframeObj.contentWindow[varName] = varValue;
    	},
        
    	/**
    	 * 通过jquery的选择表达式获取iframe中的对象元素
    	 * @param iframeObj:iframe对象
    	 * @param selector:jquery选择器
    	 * @return jquery对象
    	 */
    	getIframeJqueryElement : function(iframeObj, selector){
    		return $(selector, iframeObj.contentWindow.document);
    	},
    	
    	/**
    	 * 获取iframe的父对象
    	 */
    	getParent : function(){
    		return window.parent;
    	},
    	
    	/**
    	 * 调用父对象的方法
    	 * 
    	 * @param methodName:方法名称
    	 * @param args:方法的参数数组
    	 */
    	callParentMehtod : function(methodName, args){
    		//link:[comment1]
    		if(args === null || args === undefined){
    			args = [];
    		}
    		this.getParent()[methodName].apply(this.getParent(),args);
    	},
    	
    	/**
    	 * 获取父对象中变量的值
    	 * 
    	 * @param varName:变量的名称
    	 */
    	getParentVarValue : function(varName){
    		 return this.getParent()[varName];
    	},
    	
    	/**
    	 * 设置父对象中变量的值
    	 * 
    	 * @param varName:变量的名称
    	 * @param varValue:变量的值
    	 */
    	setParentVarValue : function(varName, varValue){
    		this.getParent()[varName] = varValue;
    	},
    	
    	/**
    	 * 获取父对象中的jquery元素
    	 * 
    	 * @param selector:jquery选择器
    	 * @return jquery对象
    	 */
    	getParentJqueryElement : function(selector){
    	    return $(selector, this.getParent().document);
    	},
    	
    	/**
    	 * 获取父页面中的指定iframeId的iframe
    	 * 
    	 * @param iframeId:iframe的id
    	 */
    	getParentIframeById : function(iframeId){
    		return $("#" + iframeId, this.getParent().document)[0];
    	},
    	
    	/**
    	 * 获取父页面中指定iframeName的iframe
    	 * 
    	 * @param iframeName:iframe的name
    	 */
    	getParentIframeByName : function(iframeName){
    		return $("iframe[name='"+iframeName+"']", this.getParent().document)[0];
    	},
    	
    	/**
    	 * 获取当前页所有的iframe
    	 * 
    	 * @currentDocument 当前的文档,默认为当前窗口
    	 * @return jquery对象数组
    	 */
    	getCurrentWindowIframes : function(currentDocument){
    		var allIframes = [];
    		$.sbiframetools._getIframes(allIframes, currentDocument, false);
    		return allIframes;
    	},
    	
    	/**
    	 * 获取当前页面所有iframe且递归iframe里面的iframe
    	 * 
    	 * @currentDocument 当前的文档,默认为当前窗口
    	 * @return jquery对象数组
    	 */
    	recursionGetCurrentWindowIframes : function(currentDocument){
    		var allIframes = [];
    		$.sbiframetools._getIframes(allIframes, currentDocument, true);
    		return allIframes;
    	},
    	
    	/**
    	 * 获取iframe
    	 * @param allIframes 获取iframe的收集容器
    	 * @param currentDocument  当前窗口的文档对象
    	 * @param isRecursion   是否递归获取iframe里面的iframe
    	 */
    	_getIframes : function(allIframes, currentDocument, isRecursion){
    		if(currentDocument === undefined){
    			currentDocument = window.document;
    		}
    		$("iframe", currentDocument).each(function(){
    			 allIframes.push($(this));
    			
    			 if(isRecursion){
    				 $.sbiframetools._getIframes(allIframes, $(this)[0].contentWindow.document, true);
    			 }
    		});
    	}
    	
    });
    
})(jQuery);/**
 * Sinobest-Image:图片展示组件
 * 
 * Dependency:dialog-plus,sinobest.dialog.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-image",
        openType: "dialog",// dialog or after content
        dialogTitle: "图片展示",
        sizeMode:"window",  //window:相对窗口的大小     parent:相对img的父元素的大小
        onInitComplete:null
    };

    $.fn.sbimage = function (options) {
        var $img = this;
        var settings;
        if (isContain()) {
            if (options) {
                settings = $.extend({}, getter().settings, options || {});
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }

        $img.settings = settings;

        function getter() {
            return $img.data("$img");
        }

        function setter() {
            $img.data("$img", $img);
        }
        
        function isContain() {
            return $img.data("$img");
        }
        
        $.sbbase.mixinWidget($img, {isAddValueMethod:false});

        $img.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    $img.attr(k, v);
                } else {
                    $img.removeAttr(k);
                }
            });
            return $img;
        };
		
        $img.getDefaultOptions = function(){
        	return defaults;
        };

        $img.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($img, "$sbimg");
            return render();
        };

        $img.open = function(){
        	$img.parent().trigger("click");
        };

        function initComplete(){
            $.sbtools.initController.initComplete($img, "$sbimg", function(){
                if(!isContain()){
                    setter();
                }
            }, $img.settings.onInitComplete);
        }

        function render() {
            $img.addClass($img.settings.className);
            $img.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            // warp
            var src = $img.attr('src');
            $img.$wrapAll = $('<a href="' + src + '" rel="' + src + '" class="sinobest-mini-image sinobest-image-wrap"></a>');
            $img.wrapAll($img.$wrapAll);

            $img.parent().on('click', function () {

                var maxImg = $(this).attr('href'),
                    viewImg = $(this).attr('rel').length === '0' ? $(this).attr('rel') : maxImg;
                imgTool($(this), maxImg, viewImg);
                return false;
            });

            var loadImg = function (url, fn) {
                var img = new Image();
                img.src = url;
                if (img.complete) {
                    fn.call(img);
                } else {
                    img.onload = function () {
                        fn.call(img);
                    };
                }
                ;
            };
            var imgTool = function (on, maxImg, viewImg) {

                var width = 0,
                    height = 0,
                    tool = function () {
                        //var mode = 2;// 1:origin 2: modal
                        //on.find('.loading').remove();
                        //on.hide();
                        if ($img.settings.openType != 'dialog') {
                            on.hide();
                        }


                        if (on.next('.sinobest-image-box').length != 0) {

                            if ($img.settings.openType != 'dialog') {
                                return on.next('.sinobest-image-box').show();
                            } else {
                                var id = on.next('.sinobest-image-box').attr('id');
                                var modalJson = {
                                    dialogType: "modal",
                                    title: $img.settings.dialogTitle,
                                    containerId: id
                                };
                                $.sbdialog(modalJson);
                                listener();
                                return;
                            }
                            // return on.next('.sinobest-image-box').show();
                        }
                        ;

                        if($img.settings.sizeMode == "parent"){
                        	// 等比例限制宽度
                            var maxWidth = on.parent().innerWidth() - 200; // 获取父级元素宽度
                            if (width > maxWidth) {
                                height = maxWidth / width * height;
                                width = maxWidth;
                            };
                        }else{
                        	//相对窗口模式
                            width =   $(window).width() - 200;
                            height =  $(window).height();
                        }
                        
                        var time = new Date();
                        var h = time.getHours() + 1;
                        var mm = time.getMinutes() + 1;
                        var s = time.getSeconds() + 1;
                        var id = "sinobest-image-box-" + h + mm + s;

                        var html = '<div id="' + id + '" class="sinobest-image-box"><div class="sinobest-image-tool"><!--<a class="hideImg" href="#" title="收起">收起</a>--><a class="imgLeft" href="#" title="向左转">向左转</a><a class="imgRight" href="#" title="向右转">向右转</a><a class="viewImg" href="' + viewImg + '" title="查看原图">查看原图</a></div><a href="' + viewImg + '" class="maxImgLink"> <img class="maxImg" width="' + width + '" height="' + height + '" src="' + maxImg + '" /></a></div>';
                        on.after(html);
                        if ($img.settings.openType != 'dialog') {
                            //$(html).show();
                        } else {
                            on.next('.sinobest-image-box').hide();
                            // open this
                            var modalJson = {
                                dialogType: "modal",
                                title: $img.settings.dialogTitle,
                                containerId: id
                            };
                            // dialog
                            $.sbdialog(modalJson);
                        }
                        listener();
                    };
                var listener = function () {

                    var box = on.next('.sinobest-image-box');
                    if ($img.settings.openType == 'dialog') {
                        box = $("div.ui-dialog-content");
                    }

                    box.hover(function () {
                        box.addClass('js_hover');
                    }, function () {
                        box.removeClass('js_hover');
                    });
                    box.find('a').off('click').on('click', function () {

                        // 收起
                        if ($(this).hasClass('hideImg') || $(this).hasClass('maxImgLink')) {
                            // 收起：弹出框时，关掉窗口；DIV显示时，隐藏DIV
                            if ($img.settings.openType == 'dialog') {
                                box.parents(".ui-dialog").find('.ui-dialog-close').click();
                            } else {
                                box.hide();
                                box.prev().show();
                            }

                        }
                        ;
                        // 左旋转
                        if ($(this).hasClass('imgLeft')) {
                            box.find('.maxImg').rotate('left')
                        }
                        ;
                        // 右旋转
                        if ($(this).hasClass('imgRight')) {
                            box.find('.maxImg').rotate('right')
                        }
                        ;
                        // 新窗口打开
                        if ($(this).hasClass('viewImg')) window.open(viewImg);

                        return false;
                    });
                };
                loadImg(maxImg, function () {
                    width = this.width;
                    height = this.height;

                    tool();
                });


                $.fn.rotate = function (p) {

                    var img = $(this)[0],
                        n = img.getAttribute('step');

                    // 保存图片大小数据
                    if (!this.data('width') && !$(this).data('height')) {
                        this.data('width', img.width);
                        this.data('height', img.height);
                    }
                    ;

                    if (n == null) n = 0;
                    if (p == 'left') {
                        (n == 3) ? n = 0 : n++;
                    } else if (p == 'right') {
                        (n == 0) ? n = 3 : n--;
                    }
                    ;
                    img.setAttribute('step', n);

                    // IE浏览器使用滤镜旋转
                    if (document.all) {
                        img.style.filter = 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + n + ')';
                        // IE8高度设置
                        if ($.sbtools.isIE8()) {
                            switch (n) {
                                case 0:
                                    this.parent().height('');
                                    //this.height(this.data('height'));
                                    break;
                                case 1:
                                    this.parent().height(this.data('width') + 10);
                                    //this.height(this.data('width'));
                                    break;
                                case 2:
                                    this.parent().height('');
                                    //this.height(this.data('height'));
                                    break;
                                case 3:
                                    this.parent().height(this.data('width') + 10);
                                    //this.height(this.data('width'));
                                    break;
                            }
                            ;
                        }
                        ;
                        
                        ieAdjustDialogSize($(this));
                        // 对现代浏览器写入HTML5的元素进行旋转： canvas
                    } else {
                        var c = this.next('canvas')[0];
                        if (this.next('canvas').length == 0) {
                            this.css({'visibility': 'hidden', 'position': 'absolute'});
                            c = document.createElement('canvas');
                            c.setAttribute('class', 'maxImg canvas');
                            img.parentNode.appendChild(c);
                        }
                        var canvasContext = c.getContext('2d');

                        switch (n) {
                            default :
                            case 0 :
                                c.setAttribute('width', img.width);
                                c.setAttribute('height', img.height);
                                canvasContext.rotate(0 * Math.PI / 180);
                                canvasContext.drawImage(img, 0, 0, img.width, img.height);
                                break;
                            case 1 :
                                c.setAttribute('width', img.height);
                                c.setAttribute('height', img.width);
                                canvasContext.rotate(90 * Math.PI / 180);
                                // 画图不限制长宽
                                canvasContext.drawImage(img, 0, -img.height, img.width, img.height);
                                break;
                            case 2 :
                                c.setAttribute('width', img.width);
                                c.setAttribute('height', img.height);
                                canvasContext.rotate(180 * Math.PI / 180);
                                canvasContext.drawImage(img, -img.width, -img.height, img.width, img.height);
                                break;
                            case 3 :
                                c.setAttribute('width', img.height);
                                c.setAttribute('height', img.width);
                                canvasContext.rotate(270 * Math.PI / 180);
                                canvasContext.drawImage(img, -img.width, 0, img.width, img.height);
                                break;
                        }
                        ;
                    }
                    ;
                };
            };

            initComplete();            
            setter();
            return $img;
        }

        /**
         * IE中用对话框显示图片时，当左右旋转的时候，对话框的高度和宽度需要动态调整
         */
        function ieAdjustDialogSize($dlgImg){
        	 //非IE不处理
        	 if(!document.all){
        		 return;
        	 }
        	 if ($img.settings.openType == 'dialog') {
        		 var $box = $dlgImg.closest("div.ui-dialog-content");
        		 if($box.length <= 0){
        			 return;
        		 }
        		 
        		 $box.width($dlgImg.width());
      	         $box.height($dlgImg.height());
        	 }
        }
        
        /**
         * 调整图片的大小
         */
		function resizeImg($img, small){
			var img = $img[0];
	        if (small){
	        	img.style.width=img.offsetWidth*0.9+"px";
	        	img.style.height=img.offsetHeight*0.9+"px";
	        }else{
	        	img.style.width= img.offsetWidth*1.1+"px";
	        	img.style.height=img.offsetHeight*1.1+"px";
	        }
	        ieAdjustDialogSize($img);
		}
        
        /**
		 * Main function
		 */
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Listbox:列表框组件
 * 
 * Dependency:sinobest.popuplayer.js,sinobest.tools.js
 */
(function ($) {
	
	/**
	 * 默认的列模型配置
	 */
	var defaultColMode =[{id:"code",name:"code",hidden:true},{id:"detail",name:"名称"}];
	
	var defaults = {   
	        id:null,
	   	    name:null,
	   	    value:null,
	   	    mode:"pop",
	   	    colModel:defaultColMode,
	   	    valueField:"code",
	   	    labelField:"detail",
	   	    url:null,
	   	    data:null,
	   	    pageSize:20,
	   	    width:null,
	   	    height:null,
	   	    listWidth:null,
	   	    listHeight:null,
	   	    searchField:["detail"],
	   	    otherRequestParam:null,
	   	    type:"multiple",
	        style:null,
	        className:"sinobest-listbox",
	        required:false,
	        readonly:false,
	        disabled:false,
	        callback:null,
	        onItemAdd:null,
	        onItemRemove:null,
	        onConfirm:null,
	        delimiter:null,
	        pageConfig:{
	            pageField:"page",
	            pageSizeField:"pageSize",
	            queryField:"query",
	            totalCountField:"totalCount",
	            pageCountField:"pageCount",
	            searchField:"searchField",
	            sortField:"sortField",
	            sortOrderField:"sortOrder",
	            dataField:"data"
	       },
	       onAjaxRequest: null, 
	       onAjaxResponse: null,
	       saveType:"c",
	       transUrl:null,
	       onTranslateRequest:null,
	       onTranslateResponse:null,
	       translateCallback:null,
	       onChange:null,
	       onInitComplete:null,
	       enableQuery:true,
	       title:null,
	       paging:true,
	       setValueTriggerChange:true,
	       enableSimpleSingleModel:false  //是否开启简单单选模式
	                                      //[只显示可选区域,listbox弹出层不支持此模式,只支持其他控件嵌套listbox时配置,单独使用listbox必须包含左右可选区域]
	};
	
    $.fn.sblistbox = function (options) { 
        var $sblistbox = this;
        var settings;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $sblistbox.settings = settings;

        function getter() {
            return $sblistbox.data("$sblistbox");
        }

        function setter() {
        	$sblistbox.data("$sblistbox", $sblistbox);
        }
        
        function isContain() {
            return $sblistbox.data("$sblistbox");
        }
        
        $.sbbase.mixinWidget($sblistbox);

        /**
         * 获取控件的值
         */
        $sblistbox.getValue = function(){
        	return getSelectedValues($sblistbox.settings.saveType);
        };
        
        function getSelectedValues(type){
        	var selectedItems = $sblistbox._$selectedListControl.getValue();
        	
        	var values = [];
        	if(type == "c"){
        		for(var i = 0, length = selectedItems.length; i < length; i++){
            		values.push(selectedItems[i][$sblistbox.settings.valueField]);
            	}
        	}else{
        		for(var j = 0, jlength = selectedItems.length; j < jlength; j++){
            		values.push(selectedItems[j][$sblistbox.settings.labelField]);
            	}
        	}
        	
        	if($sblistbox.settings.delimiter){
        		return values.join($sblistbox.settings.delimiter);
        	}
        	
        	if($sblistbox.settings.type == "single"){
        		 return values.length > 0 ? values[0] : "";
        	}
        	return values;
        }
        
        $sblistbox.getLabel = function(){
        	return getSelectedValues("d");
        };
        
        /**
         * 设置控件的值：value是数组或者code/deital以;号连接的字符串
         */
        $sblistbox.setValue = function(value){
        	doSetValue(value, function(){
        		triggerChangeWhenSetValue();
        	});
        };
        
        function doSetValue(value, completeCallBack){
        	var convertvalue = $.sbtools.convertSetValue(value);
        	if($.isArray(convertvalue) || $.sbtools.isBlank(convertvalue)){
            	processActualSetValue(convertvalue, completeCallBack, value);
        	}else{
        		$.sbbase.translateController.translate($sblistbox, {"value":convertvalue}, function(items){
        			processActualSetValue(items, completeCallBack, value);
              	});
        	}
        }
        
        function processActualSetValue(items, completeCallBack, value){
        	$sblistbox._$labelControl.setValue(items);
        	$sblistbox._$selectedListControl.init(items);
        	$sblistbox.settings.value = value;
        	
        	if(completeCallBack && $.isFunction(completeCallBack)){
        		completeCallBack();
        	}
        }
        
        function triggerChangeWhenSetValue(){
        	if($.isFunction($sblistbox.settings.onChange) && $sblistbox.settings.setValueTriggerChange){
        		//selectItems一定是有值的或者为空数组,依据getValue方法
        	    var selectItems = $sblistbox._$selectedListControl.getValue();
        		triggerOnChange(selectItems, "add", selectItems);
            }
        }
        
        /**
         * 获取选择的项目明细
         */
        $sblistbox.getSelectItems = function(){
        	return $sblistbox._$selectedListControl.getValue();
        };
        
        /**
         * 获取已选列表中的项目明细
         */
        $sblistbox.getSelectedPageItems = function(){
        	return $sblistbox._$selectedListControl.controller.getCurrentPageItems();
        };
        
        /**
         * 设置控件的状态
         */
        $sblistbox.setState = function(stateJson){
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null)  {
                    if (k == 'value') {
                    	$sblistbox.setValue(v);
                    } else {
                        if (k == 'required') {
                        	$sblistbox.settings.required = v;
                        	$sblistbox._$labelControl.attr("required", v);
                        } else if (k == 'disabled') {
                        	$sblistbox.settings.disabled = v;
                        	$sblistbox._$labelControl.attr("disabled", v);
                        	$.sbtools.toggleInputDisabledClass($sblistbox._$labelControl, v);
                        } else if(k == 'readonly'){
                        	$sblistbox.settings.readonly = v;
                        	$.sbtools.toggleInputReadonlyClass($sblistbox._$labelControl, v);
                        } else{
                        	$sblistbox.attr(k, v);
                        }
                    }
                } else {
                	$sblistbox.removeAttr(k);
                }
            });
            return $sblistbox;
        };
		
        $sblistbox.getDefaultOptions = function(){
        	return defaults;
        };
        
        /**
         * 重新加载控件
         */
        $sblistbox.reload = function(){
        	if(isPopModel()){
        		//因为将容器追加到body中,所以此处需要通过调用将容器从body中移除
        		$sblistbox._$container.remove();
        	}
        	$sblistbox.empty();
        	$.sbtools.initController.removeInitCompleteFlag($sblistbox, "$sblistbox");
        	render();
        };
        
        $sblistbox.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		
        		$sblistbox.settings.data= null;
        		$sblistbox.settings.url = null;
       		    if($.isArray(dataSource)){
       		    	$sblistbox.settings.data = dataSource;
       		    }else{
       		    	$sblistbox.settings.url = dataSource;
       		    }
       		    $sblistbox.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };

        /**
         * 销毁控件
         */
        $sblistbox.destroy = function(){
        	if(isPopModel()){
        		$sblistbox._$container.remove();
        	}
        	$sblistbox.remove();
        };
        
        /**
         * 控件的验证
         */
        $sblistbox.validate = function () {
            if ($.isFunction($sblistbox.settings.callback)) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                if ($sblistbox.settings.required) {
                    var isOk = $.sbvalidator.required($sblistbox._$labelControl[0], $sblistbox.getValue());
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return "";
            }
        };
        
        /**
         * 加载数据
         */
        $sblistbox.loadData = function(requestParam){
        	if($sblistbox.settings.otherRequestParam === null){
        		$sblistbox.settings.otherRequestParam = {};
        	}
        	$.extend($sblistbox.settings.otherRequestParam, requestParam);
        	querySelectableData(1);
        };
        
        /**
         * 获取控件的名称
         */
        $sblistbox.getName = function(){
        	return $sblistbox.settings.name;
        };
        
        /**
    	 * 是否div弹窗模式
    	 */
    	function isPopModel(){
    		if($sblistbox.settings.mode == 'pop'){
       	    	return true;
       	    }
    		return false;
    	}
    	
    	/**
    	 * 是否容器模式
    	 */
    	function isContainerModel(){
    		if($sblistbox.settings.mode == 'container'){
       	    	return true;
       	    }
    		return false;
    	}
    	
    	/**
    	 * 是否排序列
    	 */
    	function isSortableColumn(columnId){
    		for(var i = 0; i < $sblistbox.settings.colModel.length; i++){
    			 var column = $sblistbox.settings.colModel[i];
    			 if(column.id == columnId && column.sortable === true){
    				 return true;
    			 }
    		}
    		return false;
    	}
        
    	function initComplete(){
             $.sbtools.initController.initComplete($sblistbox, "$sblistbox", function(){
                 if(!isContain()){
                     setter();
                 }
             }, $sblistbox.settings.onInitComplete);
        }

    	function isPaging(){
    		if($sblistbox.settings.data != null && $sblistbox.settings.data != undefined){
    			return false;
    		}
    		
    		return $sblistbox.settings.paging;
    	}
    	
        /**
         * 渲染控件的UI结构
         */
    	function render(){
    		$sblistbox.addClass($sblistbox.settings.className);
    		$sblistbox.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
    		//当未配置id时，则以初始化元素的ID加_listbox后缀作为id
    		if($sblistbox.settings.id == null){
    			$sblistbox.settings.id = $sblistbox.attr("id") + "_listbox";
    		}
    		//listbox组件可供其他组件嵌套,此时colModel有可能存在空
    		if($sblistbox.settings.colModel == null || $sblistbox.settings.colModel == ""){
    			$sblistbox.settings.colModel = defaultColMode;
    		}
    		
    		//渲染控件中UI静态结构
    		renderLabelArea();
    		renderSelectContainerArea();
    		renderSize();
    		renderSimpleSingle();
    		
    		//UI的事件和动态功能
    		buildListbox();
    		
    		setter();
            return $sblistbox;
    	}
    	
    	/**
         * 渲染标签区域
         */
    	function renderLabelArea(){
    		if(isContainerModel()){
               return;  			
     		}
    		
			var $text = $('<input type="text" readonly></input>');
			$text.addClass($.sbtools.CONSTANTS.UICLASS.TEXT_COMMON);
			if ($sblistbox.settings.id) {
				$text.attr("id", $sblistbox.settings.id);
			}
			if ($sblistbox.settings.name) {
				$text.attr("name", $sblistbox.settings.name);
			}
			if ($sblistbox.settings.style) {
				$text.attr("style", $sblistbox.settings.style);
			}
			
			$text.attr("disabled", $sblistbox.settings.disabled);
			$.sbtools.toggleInputDisabledClass($text, $sblistbox.settings.disabled);
			
			$.sbtools.toggleInputReadonlyClass($text, $sblistbox.settings.readonly);

			$sblistbox.append($text);
			$sblistbox._$labelControl = $text;
    	}
    	
    	/**
    	 * 渲染选中容器区域
    	 */
    	function renderSelectContainerArea(){
    		var $container = $('<div class="sinobest-listbox-container sinob-widget-container"></div>');
    		if(isPopModel()){
    			$.sbpopuplayer.registerPopup($container);
       	    }
    		
       	    $container.append(renderSelectArea());
       	    $container.append(renderBtnsArea()); 
       	    
       	    //弹出层模式则将容器追加到body
       	    if(isPopModel()){
       	        if($sblistbox.attr("id")){
 				     $container.attr("id", $sblistbox.attr("id") + "_listbox_container");
 			    }else{
 				     if($sblistbox.settings.id){
 					    $container.attr("id", $sblistbox.settings.id + "_listbox_container");
 				     }
 			    }
 			    $(document.body).append($container);  
       	    }else{
       	        $sblistbox.append($container);
       	    }
       	    $sblistbox._$container = $container;
    	}
    	
    	/**
    	 * 渲染选择区
    	 */
    	function renderSelectArea(){
            var $select = $('<div class="sinobest-listbox-select"></div>');
        	
            $select.append(renderTitleArea());
        	$select.append(renderSelectableArea());
            $select.append(renderSelectBtnsArea());
            $select.append(renderSelectedArea());
            
            $select.append('<div style="clear:both;"></div>');
            
            return $select;
    	}
    	
    	/**
    	 * 渲染标题
    	 */
    	function renderTitleArea(){
    		if($.sbtools.isBlank($sblistbox.settings.title)){
    			return;
    		}
    		var $header = $('<div class="sinobest-listbox-header"></div>');
    		var $title =  $('<div class="sinobest-listbox-header-title"></div>');
			$title.text($sblistbox.settings.title);
    		$header.append($title);
    		return $header;
    	}
    	
    	/**
         * 渲染可选区域
         */
    	function renderSelectableArea(){
    		  //可选区域
    		  var $selectable = $('<div class="sinobest-listbox-selectable"></div>');
              
    		  //查询
    		  var $selectableQuery = "";
    		  var $selectableQueryText = "";
    		  //var $selectableQueryBtn = "";
    		  if($sblistbox.settings.enableQuery){
    			   $selectableQuery = $('<div class="sinobest-listbox-selectable-query"></div>');
              	   $selectableQueryText = $('<input type="text" class="sinobest-text-query"></input>'); 
              	   //$selectableQueryBtn = $('<input type="button" value="查询" class="sinobest-button-common sinobest-listbox-selectable-query-btn"></input>'); 
                   $selectableQuery.append($selectableQueryText)
                   //.append($selectableQueryBtn);
    		  }
          	 
              //可选控件
              var $selectableListContainer = $('<div class="sinobest-listbox-selectable-list-container"></div>');
              var $selectableListContent = $('<div class="sinobest-listbox-selectable-list-content"></div>');
              var $selectableList = ListController.renderList(true);
              $selectableListContainer.append($selectableListContent.append($selectableList));
              
              //分页
              var $selectablePage = $('<div class="sinobest-listbox-selectable-page">');
              $selectablePage.append($('<div class="sinobest-listbox-page-total"></div>'))
                             .append($('<span><input type="button" value="" class="sinobest-listbox-page-btn sinobest-listbox-page-first"></input>'
                          		     +'<input type="button" value="" class="sinobest-listbox-page-btn  sinobest-listbox-page-pre"></input></span>'))
                             .append($('<span class="sinobest-listbox-page-totalpage"></span>'))
                             .append($('<span><input type="button" value="" class="sinobest-listbox-page-btn sinobest-listbox-page-next"></input>'
                          		     +'<input type="button" value="" class="sinobest-listbox-page-btn sinobest-listbox-page-last"></input></span>'));
         
              //渲染可选区域
              $selectable.append($selectableQuery).append($selectableListContainer);
              if(isPaging()){
            	  $selectable.append($selectablePage);
              }
              
              $sblistbox._$selectable = $selectable;
              if($sblistbox.settings.enableQuery){
            	  $sblistbox._$selectableQueryTextControl = $selectableQueryText;
                  //$sblistbox._$selectableQueryBtnControl = $selectableQueryBtn;
              }
              $sblistbox._$selectableListContent = $selectableListContent;
              $sblistbox._$selectableListControl = $selectableList;
              $sblistbox._$selectablePageControl = $selectablePage;
              return $selectable;
    	}
    	
    	/**
    	 * 渲染选择按钮区
    	 */
    	function renderSelectBtnsArea(){
    		 var $selectbtns = $('<div class="sinobest-listbox-selectbtns"></div>');
             $selectbtns.append($('<div><input type="button" value="添加 >"   class="sinobest-button-common sinobest-listbox-selectbtns-btn sinobest-listbox-btn-add"></input></div>'))
                        .append($('<div><input type="button" value="删除 <"   class="sinobest-button-common sinobest-listbox-selectbtns-btn sinobest-listbox-btn-remove"></input></div>'))
                        .append($('<div><input type="button" value="全增>>"  class="sinobest-button-common sinobest-listbox-selectbtns-btn sinobest-listbox-btn-addAll"></input></div>'))
                        .append($('<div><input type="button" value="全删<<"  class="sinobest-button-common sinobest-listbox-selectbtns-btn sinobest-listbox-btn-removeAll"></input></div>'));
             $sblistbox._$selectbtnsControl = $selectbtns;
             return $selectbtns;
    	}
    	
    	/**
         * 渲染已选区域
         */
        function renderSelectedArea(){
        	 var $selected = $('<div class="sinobest-listbox-selected"></div>');
        	 
        	 var $selectedListContainer = $('<div class="sinobest-listbox-selected-list-container"></div>');
        	 var $selectedListContent = $('<div class="sinobest-listbox-selected-list-content"></div>');
             var $selectedList = ListController.renderList(false);
             $selectedListContainer.append($selectedListContent.append($selectedList));
             
             $selected.append($selectedListContainer);
             $sblistbox._$selected = $selected;
             $sblistbox._$selectedListContent = $selectedListContent;
             $sblistbox._$selectedListControl = $selectedList;
             return $selected;
        }
    	
        /**
         * 渲染按钮区域
         */
        function renderBtnsArea(){
        	if(isContainerModel()){
        		return;
        	}
        	
        	var $btns = $('<div class="sinobest-listbox-btns"></div>');
        	var $confirmBtn = $('<input type="button" value="确定"   class="sinobest-button-common sinobest-listbox-btns-confirmbtn"></input>'); 
        	var $closeBtn =   $('<input type="button" value="关闭"   class="sinobest-button-common sinobest-listbox-btns-closebtn"></input>');
        	$btns.append($confirmBtn).append($closeBtn);
        	
        	$sblistbox._$confirmBtnControl = $confirmBtn;
        	$sblistbox._$closeBtnControl = $closeBtn;
         	return $btns;
        }
        
        /**
         * 渲染容器,列表控件的高度和宽度
         */
        function renderSize(){
           //设置listbox容器的高度和宽度
           if($sblistbox.settings.width){
        	   $sblistbox._$container.width($sblistbox.settings.width);
           }	
           if($sblistbox.settings.height){
        	   $sblistbox._$selectable.height($sblistbox.settings.height);
        	   $sblistbox._$selected.height($sblistbox.settings.height);
           }
           
           //设置列表控件的高度和宽度
           if($sblistbox.settings.listWidth){
        	   $sblistbox._$selectableListContent.width($sblistbox.settings.listWidth);
        	   $sblistbox._$selectedListContent.width($sblistbox.settings.listWidth);
        	   
        	   //修复IE6,IE7下面，分页控件宽度显示100%,导致已选区域换行显示问题
        	   if($.sbtools.isIE6OrIE7()){
        		   $sblistbox._$selectablePageControl.width($sblistbox.settings.listWidth);
        	   }
           }
           if($sblistbox.settings.listHeight){
        	   $sblistbox._$selectableListContent.height($sblistbox.settings.listHeight);
        	   $sblistbox._$selectedListContent.height($sblistbox.settings.listHeight);
           }
        }
        
        /**
         * 渲染简单的单选模式
         */
        function renderSimpleSingle(){
        	if(!$sblistbox.settings.enableSimpleSingleModel){
        		return;
        	}
        	if($sblistbox.settings.type !== "single"){
        		return;
        	}
        	
            $sblistbox._$selected.hide();
            $sblistbox._$selectbtnsControl.hide();
            	
            $sblistbox._$container.addClass("sinobest-listbox-container-simple-single");
            $sblistbox._$selectableListContent.addClass("sinobest-listbox-selectable-simple-single");
        }
        
        /**
         * 构建Listbox控件，注册事件，控件交互，初始化数据等动态功能
         */
        function buildListbox(){
        	 //未点击弹出对话框前，不需要填充的数据的标示:如远程请求的数据。
        	 $sblistbox._$container.isFillDynamicDatas = false;
        	 buildLabel();
             buildSelect();
             buildBtns();
             
             fillDatas();
        }
        
        /**
         * 构建标签控件
         */
        function buildLabel(){
        	if(isContainerModel()){
        		//容器模式,创建一个无任何逻辑的标签控件
        		$sblistbox._$labelControl = {
        			setValue:function(items){
        			}
        		};
                return;   			
      		}
        	
        	$sblistbox._$labelControl.bind("click",function(){
        		 if($sblistbox.settings.readonly){
        			 return;
        		 }
        		 
        		 if($sblistbox._$container.is(":visible")){
					return;
				 }
        			
                 if(!$sblistbox._$container.isFillDynamicDatas){
                	 fillDynamicDatas(); 
                	 $sblistbox._$container.isFillDynamicDatas = true;
        		 }
                 $.sbpopuplayer.popup($sblistbox._$container);
        	});
        	
        	$sblistbox._$labelControl.setValue = function(items){
        		 if(items != undefined && items.length > 0 ){
        			 var labelValue = "";
        			 if($sblistbox.settings.type == 'single'){
        				 labelValue += items[0][$sblistbox.settings.labelField];
        			 }else{
        				 for(var i = 0, length = items.length; i < length; i++){
            				 labelValue += items[i][$sblistbox.settings.labelField];
            				 if(i != items.length - 1){
            					 labelValue += ";";
            				 }
            			 }
        			 }
        			 this.val(labelValue);
        			 this.attr("title", labelValue);
        		 }else{
        			 this.val("");
        			 this.attr("title", "");
        		 }
        	};
        }
        
        /**
		 * 构建选择
		 */
        function buildSelect(){
           buildSelectable();
   		   buildSelectBtns();
   		   buildSelected();
        }
        
       /**
         * 列表控件的控制器
       */
       var ListController = function($control){
       	    this.$control = $control;
       };
       
       /**
        * 渲染列表控件
        * @returns
        */
       ListController.renderList = function(isRenderSort){
    	   var $table = $('<table cellspacing="0" cellpadding="0" class="sinobest-listbox-list"></table>');
    	   var $thead = $('<thead><tr></tr></thead>');
    	   
    	   for(var i = 0, length = $sblistbox.settings.colModel.length; i < length; i++){
    		    var column = $sblistbox.settings.colModel[i];
    		    
    		    var $th = $('<th></th>');
    		    $th.attr("field", column.id);
    		    $th.text(column.name);
    		    if(column.width){
    		    	$th.css("width", column.width);
    		    }
    		    if(column.hidden){
    		    	$th.css("display", "none");
    		    }
    		    $thead.find("tr:first").append($th);
    	   }
    	   
    	   if(isRenderSort){
    		  //渲染排序列
        	  for(var j = 0, jLength = $sblistbox.settings.colModel.length; j < jLength; j++){
        		   var column = $sblistbox.settings.colModel[j];
        		   if(column.sortable){
        			  $thead.find("tr:first").find("th[field='"+column.id+"']")
        			         .append('<span class="sinobest-listbox-list-sort sinobest-listbox-list-sort-asc" order="asc"></span>');
        			  break;
       		       }
        	  }
    	   }
    	   
    	   $table.append($thead).append("<tbody></tbody>");
    	   return $table;
       };
       
       ListController.prototype = {
       		/**
       		 * 增加选项
       		 * @param items
       		 */
       		addItems : function(items){
       			if(items == undefined){
       				return;
       			}
           		for(var i = 0, length = items.length; i < length; i++){
           			var item = items[i];
           			
          			var $tr = $("<tr></tr>");
          			$tr.attr("row-key", item[$sblistbox.settings.valueField]);
          			$tr.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, item);
          			this.bindItemEvent($tr);
          			
          			for(var colIndex = 0, colLength = $sblistbox.settings.colModel.length; colIndex < colLength; colIndex++){
          				  var column = $sblistbox.settings.colModel[colIndex];
          				  
          				  var columnValue = (item[column.id] == undefined ? "" : item[column.id]);
          				  var $td = $("<td></td>");
          				  $td.text(columnValue);
          				  if(column.hidden){
          					  $td.css("display","none");
          				  }
          				  $tr.append($td);
          			}
          			this.$control.find("tbody").append($tr);
           		}
           	},
           	
           	/**
           	 * 给选择控件中的条目绑定事件
           	 * @param $item
           	 */
           	bindItemEvent: function($item){
           		if($sblistbox.settings.enableSimpleSingleModel && $sblistbox.settings.type == "single"){
           			this._bindSimpleSingleItemEvent($item);
           		}else{
           			this._bindGeneralItemEvent($item);
           		}
           	},
           	
           	_bindGeneralItemEvent:function($item){
           		$item.on("click", function(){
        			   if($(this).data("selected") || $(this).hasClass("sinobest-listbox-list-item-selected")){
        				   $(this).removeData("selected");
        			   }else{
            			   $(this).data("selected", true);
        			   }
        			   $(this).toggleClass("sinobest-listbox-list-item-selected");
        			   
        		 }).on("dblclick",function(){
                	   var selector = "tbody tr[row-key='"+$(this).attr("row-key")+"']";
                 	   if($sblistbox._$selectableListControl.find(selector).length > 0){
                 		   $(this).data("selected", true);
                 		   $sblistbox._$selectbtnsControl.triggerAddEvent();
                 		   return;
                 	   }
                 	   
                 	   if($sblistbox._$selectedListControl.find(selector).length > 0){
                 		   $(this).data("selected", true);
                 		   $sblistbox._$selectbtnsControl.triggerRemoveEvent();
                 		   return;
                 	   }
                 });
           		
           		 this._bindItemHover($item);
           	},
           	
           	_bindSimpleSingleItemEvent:function($item){
           		$item.on("click", function(){
           		       //#0清空隐藏的已选区域
           			   $sblistbox._$selectedListControl.controller.clearItems();
           			  
        			   if($(this).data("selected") || $(this).hasClass("sinobest-listbox-list-item-selected")){
        				   //删除
        				   $(this).removeData("selected");
        				   /*  var selectItems = $sblistbox._$selectableListControl.controller.getSelectItems();
        				   triggerOnChange(selectItems, "remove", selectItems);*/
        			   }else{
        				   //增加
        				   //#1 将可选列表之前选中的都设置为非选中
        				   $sblistbox._$selectableListControl.controller.clearAllSelectedFlag();
        				   
        				   //#2 将选中的增加到已选列表中
        				   $(this).data("selected", true);
            			   var selectItems = $sblistbox._$selectableListControl.controller.getSelectItems();
                     	   if(invokeCallback("onItemAdd", [selectItems])){
                         		$sblistbox._$selectedListControl.controller.addItems(selectItems);
                         		//triggerOnChange(selectItems, "add", selectItems);
                     	   }
        			   }
        			   $(this).toggleClass("sinobest-listbox-list-item-selected");
        		 });
           		
           	     this._bindItemHover($item);
           	},
           	
         	_bindItemHover:function($item){
           		$item.hover(function () {
                               $(this).addClass("sinobest-listbox-list-item-hover");
                            },
                            function () { 
     	                       $(this).removeClass("sinobest-listbox-list-item-hover");
                            });
           	},
           	
           	/**
           	 * 获取选择的选项
           	 */
           	getSelectItems:function(){
           		 var _this = this;
           		 var selectItems = new Array();
           		 this.$control.find("tbody tr").each(function(index, elementTr){
        			  if($(elementTr).data("selected")){
        				  var item = {};
        				  $(elementTr).find("td").each(function(tdIndex, elementTd){
        					   var column = $sblistbox.settings.colModel[tdIndex];
        					   var id = column.id;
        					   item[id] = $(elementTd).text();
        				  });
        				  item = _this.addDataFieldsColumnValue($(elementTr).data($.sbtools.CONSTANTS.DATA_SBITEM_KEY), item);
        				  selectItems.push(item);
        			  };
        		 });
           		 return selectItems;
           	},
           	
           	/**
           	 * 清空已选标记
           	 */
           	clearSelectedFlag:function(items){
           		for(var i = 0, length = items.length; i < length; i++){
           			var item = items[i];
           			var $itemTr = this.$control.find("tbody tr[row-key='"+ item[$sblistbox.settings.valueField]+"']");
           			if($itemTr){
           				$itemTr.removeData("selected");
           				$itemTr.removeClass("sinobest-listbox-list-item-selected");
           			}
           		}
           	},
           	
           	/**
           	 * 清空所有已选的标记
           	 */
           	clearAllSelectedFlag:function(){
           		this.$control.find("tbody tr").each(function(index, elementTr){
      			    if($(elementTr).data("selected")){
      				   $(elementTr).removeData("selected");
      				   $(elementTr).removeClass("sinobest-listbox-list-item-selected");
      			    };
      		    });
           	},
           	
           	/**
           	 * 获取当前页的选项
           	 */
           	getCurrentPageItems:function(){
           		 var _this = this;
           		 var currentPageItems = new Array();
           		 this.$control.find("tbody tr").each(function(index, elementTr){
      				  var item = {};
      				  $(elementTr).find("td").each(function(tdIndex, elementTd){
      					   var column = $sblistbox.settings.colModel[tdIndex];
      					   var id = column.id;
      					   item[id] = $(elementTd).text();
      				  });
      				  item = _this.addDataFieldsColumnValue($(elementTr).data($.sbtools.CONSTANTS.DATA_SBITEM_KEY), item);
      				  currentPageItems.push(item);
      		     });
           		 return currentPageItems;
           	},
           	
           	/**
           	 * 删除已选择的选项
           	 */
           	removeSelectItems : function(){
           		this.$control.find("tbody tr").each(function(index, elementTr){
        			  if($(elementTr).data("selected")){
        				  $(elementTr).remove();
        			  };
        		 });
           	},
           	
           	/**
           	 * 清空选项
           	 */
           	clearItems : function(){
           		this.$control.find("tbody").empty();
           	},
           	
           	/**
           	 * 删除指定的选项
           	 * @param items
           	 */
           	removeItems : function(items){
           		for(var i = 0, length = items.length; i < length; i++){
           			var item = items[i];
           			this.$control.find("tbody tr[row-key='"+ item[$sblistbox.settings.valueField]+"']").remove();
           		}
           	},
           	
           	/**
           	 * 绑定排序事件
           	 */
           	bindSortEvent: function(){
         	   this.$control.find("thead tr:first>th").each(function(index, elementHeader){
         		   $(elementHeader).bind("click", function(){
         			   if(!isSortableColumn($(this).attr("field"))){
         				   return;
         			   }
         			   
         			   //删除之前的排序列
         			   $(this).parent().find("th[field!='"+$(this).attr("field")+"']").each(function(otherIndex, otherElementHeader){
         				   var $beforeSort = $(otherElementHeader).find("span:first");
         				   if($beforeSort.hasClass("sinobest-listbox-list-sort")){
         					   $beforeSort.remove();
         					   return false;
         				   }
         			   });
         			   
         			   //当前排序列
         			   var $currentSort = $(this).find("span:first");
         			   if($currentSort.hasClass("sinobest-listbox-list-sort")){
         				   if($currentSort.hasClass("sinobest-listbox-list-sort-asc")){
         					   $currentSort.removeClass("sinobest-listbox-list-sort-asc");
         					   $currentSort.addClass("sinobest-listbox-list-sort-desc");
         					   $currentSort.attr("order", "desc");
         				   }else{
         					   if($currentSort.hasClass("sinobest-listbox-list-sort-desc")){
             					   $currentSort.removeClass("sinobest-listbox-list-sort-desc");
             					   $currentSort.addClass("sinobest-listbox-list-sort-asc");
             					   $currentSort.attr("order", "asc");
             				   }
         				   }
         			   }else{
         				   $(this).append('<span class="sinobest-listbox-list-sort sinobest-listbox-list-sort-asc" order="asc"></span>');
         			   }
         			   
         			   //触发排序事件
         			   querySelectableData(1);
         		   });
         	   });
            
           	},
           	
           	/**
           	 * 获取排序值:当不存在时，返回null
           	 */
           	getSortValue: function(){
           		var sortValue = null;
           		this.$control.find("thead tr:first>th").each(function(index, element){
           			var $sort = $(element).find("span:first");
           			if($sort.hasClass("sinobest-listbox-list-sort")){
           				sortValue = {
           					sortField:$(element).attr("field"),
           					sortOrder:$sort.attr("order")
           				};
           				return false;
           			}
           		});
           		return sortValue;
           	},
           	
           	addDataFieldsColumnValue:function(dataItem, originalValue){
           		if(dataItem === undefined || dataItem === null){
           			return originalValue;
           		}
           		
    			for(var itemKey in dataItem){
    				if(originalValue.hasOwnProperty(itemKey)){
        				continue;
        			}
        			originalValue[itemKey] = dataItem[itemKey];
    			}
    			return originalValue;
           	}
       };
        
       /**
        * 构建可选区域
        */
       function buildSelectable(){
		    // 查询按钮
    	    buildQuery();
       	
       	   //可选列表
       	   $sblistbox._$selectableListControl.controller = new ListController($sblistbox._$selectableListControl);
       	   $sblistbox._$selectableListControl.init = function(dataResponse){
       		        this.controller.clearItems();
       		        this.controller.addItems(dataResponse[$sblistbox.settings.pageConfig.dataField]);
       		        
       		        //已选的选项不显示在可选
       	       		if(typeof $sblistbox._$selectedListControl.controller.getCurrentPageItems == 'function'){
       	       			var selectedCurrentItems = $sblistbox._$selectedListControl.controller.getCurrentPageItems();
       	       			this.controller.removeItems(selectedCurrentItems);
       	       		}else{
       	       			this.controller.removeItems($sblistbox.settings.value);
       	       		}
       	   };
       	   $sblistbox._$selectableListControl.controller.bindSortEvent();
       	   $sblistbox._$selectableListControl.getSortValue = function(){
       		   return this.controller.getSortValue();
       	   };
       	   
       	   //分页初始化
           $sblistbox._$selectablePageControl.init = function(dataResponse){
        	    if(!isPaging()){
        		   return;
        	    }
        	    var totalPage = (dataResponse[$sblistbox.settings.pageConfig.pageCountField] == null)
        	                                        ? 0 :dataResponse[$sblistbox.settings.pageConfig.pageCountField];
          		this.data("totalpage", totalPage);
          		
          	    //无记录page设置为0
           		var page = (dataResponse[$sblistbox.settings.pageConfig.totalCountField] == 0 
           				                            ? 0 : dataResponse[$sblistbox.settings.pageConfig.pageField]);
           		this.data("page", page);
           		
           		this.find("div.sinobest-listbox-page-total").html('共' + dataResponse[$sblistbox.settings.pageConfig.totalCountField] + '条记录');
           		this.find("span.sinobest-listbox-page-totalpage").html(page + "/" + totalPage);
           		
           		$sblistbox._$selectablePageControl.refreshButtonState(page, totalPage);
                
          };
          
          function buildQuery(){
        	  if(!$sblistbox.settings.enableQuery){
        		  return;
        	  }
        	  
        	  //快速查询
        	  $sblistbox._$selectableQueryTextControl.on("keyup", function(){
        		    var lastQuery = $sblistbox._$selectableQueryTextControl.lastQuery;
				    if(lastQuery == $sblistbox._$selectableQueryTextControl.val()) {
					    return;
				    }
				    $sblistbox._$selectableQueryTextControl.lastQuery = $sblistbox._$selectableQueryTextControl.val();
				    querySelectableData(1);
              });
        	   
  		      /*$sblistbox._$selectableQueryBtnControl.bind("click",function() {
  				    var lastQuery = $sblistbox._$selectableQueryTextControl.lastQuery;
  				    if(lastQuery == $sblistbox._$selectableQueryTextControl.val()) {
  					    return;
  				    }
  				    $sblistbox._$selectableQueryTextControl.lastQuery = $sblistbox._$selectableQueryTextControl.val();
  				    querySelectableData(1);
         	  });*/
          }
          
          $sblistbox._$selectablePageControl.getFirstPage = function(pageName){
        	  return $sblistbox._$selectablePageControl.find(".sinobest-listbox-page-first");
          };
          
          $sblistbox._$selectablePageControl.getPrePage = function(){
        	  return $sblistbox._$selectablePageControl.find(".sinobest-listbox-page-pre");
          };
          
          $sblistbox._$selectablePageControl.getNextPage = function(){
        	  return $sblistbox._$selectablePageControl.find(".sinobest-listbox-page-next");
          };
          
          $sblistbox._$selectablePageControl.getLastPage = function(){
        	  return $sblistbox._$selectablePageControl.find(".sinobest-listbox-page-last");
          };
          
          
          //刷新按钮的状态
          $sblistbox._$selectablePageControl.refreshButtonState = function(page, totalPage){
        	  if(page == 1 || page == 0){
        		 $sblistbox._$selectablePageControl.getFirstPage().attr("disabled","disabled");
        		 $sblistbox._$selectablePageControl.getPrePage().attr("disabled","disabled");
             	 
        		 $sblistbox._$selectablePageControl.getFirstPage().addClass("sinobest-listbox-page-first-disabled");
        		 $sblistbox._$selectablePageControl.getPrePage().addClass("sinobest-listbox-page-pre-disabled");
              }else{
            	 $sblistbox._$selectablePageControl.getFirstPage().removeAttr("disabled");
            	 $sblistbox._$selectablePageControl.getPrePage().removeAttr("disabled");
             	 
            	 $sblistbox._$selectablePageControl.getFirstPage().removeClass("sinobest-listbox-page-first-disabled");
            	 $sblistbox._$selectablePageControl.getPrePage().removeClass("sinobest-listbox-page-pre-disabled");
              }

              if(page == totalPage){
            	  nextAndLastPageDisabled();
              }else{
            	  $sblistbox._$selectablePageControl.getNextPage().removeAttr("disabled");
            	  $sblistbox._$selectablePageControl.getLastPage().removeAttr("disabled");
             	 
            	  $sblistbox._$selectablePageControl.getNextPage().removeClass("sinobest-listbox-page-next-disabled");
            	  $sblistbox._$selectablePageControl.getLastPage().removeClass("sinobest-listbox-page-last-disabled");
              }
              
              if(totalPage == 0){
            	  nextAndLastPageDisabled();
              }
          };
          
          /**
           * 下一页和最后一页disabled
           */
          function nextAndLastPageDisabled(){
        	 $sblistbox._$selectablePageControl.getNextPage().attr("disabled","disabled");
         	 $sblistbox._$selectablePageControl.getLastPage().attr("disabled","disabled");
          	 
         	 $sblistbox._$selectablePageControl.getNextPage().addClass("sinobest-listbox-page-next-disabled");
         	 $sblistbox._$selectablePageControl.getLastPage().addClass("sinobest-listbox-page-last-disabled");
          }
       	
          //分页按钮事件
          $sblistbox._$selectablePageControl.getFirstPage().bind("click", function(){
         		var page = Number($sblistbox._$selectablePageControl.data("page"));
         		if(page == 1 || page == 0){
         			return;
         		}
         		querySelectableData(1);
          });
          $sblistbox._$selectablePageControl.getPrePage().bind("click", function(){
         		var page = Number($sblistbox._$selectablePageControl.data("page"));
         		if(page - 1 == 0 || page == 0){
         			return;
         		}
         		querySelectableData(Number($sblistbox._$selectablePageControl.data("page")) - 1);
          });
          $sblistbox._$selectablePageControl.getNextPage().bind("click", function(){
         		var page = Number($sblistbox._$selectablePageControl.data("page"));
         		var totalPage = Number($sblistbox._$selectablePageControl.data("totalpage"));
         		if(page  == totalPage || page == 0){
         			return;
         		}
         		querySelectableData(Number($sblistbox._$selectablePageControl.data("page")) + 1);
          });
          $sblistbox._$selectablePageControl.getLastPage().bind("click", function(){
         		var page = Number($sblistbox._$selectablePageControl.data("page"));
         		var totalPage = Number($sblistbox._$selectablePageControl.data("totalpage"));
         		if(page == totalPage || page == 0){
         			return;
         		}
         		querySelectableData(Number($sblistbox._$selectablePageControl.data("totalpage")));
          });
       }
        
       function getQueryTextValue(){
     	  if($sblistbox.settings.enableQuery){
     		  return $sblistbox._$selectableQueryTextControl.val();
     	  }else{
     		  return "";
     	  }
       }
       
       /**
        * 请求可选列表的数据
        */
       function querySelectableData(page){
			var queryRequest = new Object();
			$.extend(queryRequest, $sblistbox.settings.otherRequestParam || {});
			
			queryRequest[$sblistbox.settings.pageConfig.pageField] = page;
			queryRequest[$sblistbox.settings.pageConfig.queryField] = getQueryTextValue();
			queryRequest[$sblistbox.settings.pageConfig.pageSizeField] = $sblistbox.settings.pageSize;
			queryRequest[$sblistbox.settings.pageConfig.searchField] = $sblistbox.settings.searchField.join(";");
			
			var sortValue = $sblistbox._$selectableListControl.getSortValue();
			if(sortValue != null){
				queryRequest[$sblistbox.settings.pageConfig.sortField] = sortValue.sortField;
			    queryRequest[$sblistbox.settings.pageConfig.sortOrderField] = sortValue.sortOrder;
			}
			
			if($sblistbox.settings.data != null && $sblistbox.settings.data != undefined){
				querySelectableDataFromLocal(queryRequest, function(dataResponse){
					$sblistbox._$selectableListControl.init(dataResponse);
					$sblistbox._$selectablePageControl.init(dataResponse);
				});
			}else{
				querySelectableDataFromUrl(queryRequest, function(dataResponse){
					$sblistbox._$selectableListControl.init(dataResponse);
					$sblistbox._$selectablePageControl.init(dataResponse);
				});
			}
       }
    	
       /**
        * 查询可选的数据从url
        */
       function querySelectableDataFromUrl(queryRequest, queryCompleteCallBack){
    	   if($sblistbox.settings.onAjaxRequest && $.isFunction($sblistbox.settings.onAjaxRequest)){
				queryRequest = ($sblistbox.settings.onAjaxRequest)(queryRequest);
		    }
			 
			$.ajax({
				type : "post",
				contentType : "application/json; charset=utf-8",
				dataType : "json",
				data : JSON.stringify(queryRequest),
				url : $sblistbox.settings.url,
				success : function(dataResponse) {
					if($sblistbox.settings.onAjaxResponse && $.isFunction($sblistbox.settings.onAjaxResponse)){
						  ($sblistbox.settings.onAjaxResponse)(dataResponse);
					}
					queryCompleteCallBack(dataResponse);
				},
				error : function(XMLHttpRequest, textStatus, errorThrown) {
					var e = new Object();
					e.code = XMLHttpRequest.status;
					e.msg = $.sberror.format(e.code, this.url);
					$.sberror.onError(e);
				}
			});
       }
       
       /**
        * 查询可选的数据从本地
        */
       function querySelectableDataFromLocal(queryRequest, queryCompleteCallBack){
    	   var queryResult = {};
       	
	       var query = queryRequest[$sblistbox.settings.pageConfig.queryField];
           if($.sbtools.isBlank(query)){
        	   queryResult[$sblistbox.settings.pageConfig.dataField] =  $sblistbox.settings.data;
        	   queryCompleteCallBack(queryResult);
        	   return;
           }
           
           var searchField = queryRequest[$sblistbox.settings.pageConfig.searchField];
           if($.sbtools.isNotBlank(searchField)){
        	   queryResult[$sblistbox.settings.pageConfig.dataField] =  [];
           	   var searchFieldFilter = searchField.split(";");
           	   for(var i = 0; i < $sblistbox.settings.data.length; i++){
           		  var dataItem = $sblistbox.settings.data[i];
           		  for(var sI = 0; sI < searchFieldFilter.length; sI++) {
           			   var dataItemValue = dataItem[searchFieldFilter[sI]];
           			   if(dataItemValue && dataItemValue.indexOf(query) > -1){
           				   queryResult[$sblistbox.settings.pageConfig.dataField].push(dataItem);
           				   break;
           			   }
           		   }
               }
           }
           queryCompleteCallBack(queryResult);
      }
       
       /**
        * 构建按钮区域
        */
       function buildSelectBtns(){
    		$sblistbox._$selectbtnsControl.triggerAddEvent = function(){
         		 this.find(".sinobest-listbox-btn-add").trigger("click");
         	};
         	
         	$sblistbox._$selectbtnsControl.triggerRemoveEvent = function(){
        		 this.find(".sinobest-listbox-btn-remove").trigger("click");
        	};
        	
    	    //添加
          	$sblistbox._$selectbtnsControl.find(".sinobest-listbox-btn-add").bind("click", function(){
          		var selectItems = $sblistbox._$selectableListControl.controller.getSelectItems();
    
          		if(!canSelectMultipleItems(selectItems)){
          			$sblistbox._$selectableListControl.controller.clearSelectedFlag(selectItems);
          			return;
          		}
          		if(selectItems === null || selectItems.length <= 0){
          			return;
          		}
          		if(invokeCallback("onItemAdd", [selectItems])){
          			$sblistbox._$selectableListControl.controller.removeSelectItems();
              		$sblistbox._$selectedListControl.controller.addItems(selectItems);
              		//triggerOnChange(selectItems, "add", $sblistbox._$selectedListControl.controller.getCurrentPageItems());
          		}
          	});
          	
          	//删除
          	$sblistbox._$selectbtnsControl.find(".sinobest-listbox-btn-remove").bind("click", function(){
          		var selectedItems = $sblistbox._$selectedListControl.controller.getSelectItems();
          		if(selectedItems === null || selectedItems.length <= 0){
          			return;
          		}
          		if(invokeCallback("onItemRemove", [selectedItems])){
          			$sblistbox._$selectedListControl.controller.removeSelectItems();
              		$sblistbox._$selectableListControl.controller.addItems(selectedItems);
              		//triggerOnChange(selectedItems, "remove", $sblistbox._$selectedListControl.controller.getCurrentPageItems());
          		}
          	});
          	
          	//全增
          	$sblistbox._$selectbtnsControl.find(".sinobest-listbox-btn-addAll").bind("click", function(){
          		var currentPageItems = $sblistbox._$selectableListControl.controller.getCurrentPageItems();
          		if(!canSelectMultipleItems(currentPageItems)){
          			return;
          		}
          		if(currentPageItems === null || currentPageItems.length <= 0){
          			return;
          		}
          		if(invokeCallback("onItemAdd", [currentPageItems])){
          			$sblistbox._$selectableListControl.controller.clearItems();
              		$sblistbox._$selectedListControl.controller.addItems(currentPageItems);
              		//triggerOnChange(currentPageItems, "add", $sblistbox._$selectedListControl.controller.getCurrentPageItems());
          		}
          	});
          	//全删
          	$sblistbox._$selectbtnsControl.find(".sinobest-listbox-btn-removeAll").bind("click", function(){
          		var currentPageItems = $sblistbox._$selectedListControl.controller.getCurrentPageItems();
          		if(currentPageItems === null || currentPageItems.length <= 0){
          			return;
          		}
          		if(invokeCallback("onItemRemove", [currentPageItems])){
          			$sblistbox._$selectedListControl.controller.clearItems();
              		$sblistbox._$selectableListControl.controller.addItems(currentPageItems);
              		//triggerOnChange(currentPageItems, "remove", $sblistbox._$selectedListControl.controller.getCurrentPageItems());
          		}
          	});
       }
       
       /**
        * 能否选择多条记录
        */
       function canSelectMultipleItems(selectItems){
    		if($sblistbox.settings.type == 'single'){
       			if($sblistbox._$selectedListControl.controller.getCurrentPageItems().length >= 1
       					|| selectItems.length > 1){
       				alert("最多只能选择一条记录");
       				return false;
       			}
       		}
           	return true;
       }
       
       /**
        * 调用回调函数
        * @param functionName 函数名
        * @param args         参数数组
        */
       function invokeCallback(functionName, args){
             if(typeof $sblistbox.settings[functionName] == 'function'){
       		     var result = $sblistbox.settings[functionName].apply($sblistbox, args);
       	         return result === undefined ? true : result;
             }
       	     return true;
       }
       
       /**
        * @param currentItem   当前的项
        * @param oper          操作标示
        * @param selectedItems 已选的项
        */
       function triggerOnChange(currentItem, oper, selectedItems){
    	   if(!$sblistbox.settings.onChange){
    		   return;
    	   }
    	   invokeCallback("onChange", [currentItem, oper, selectedItems]);
       }
       
       /**
        * 构建已选区域
        */
      function buildSelected(){
    	    $sblistbox._$selectedListControl.controller = new ListController($sblistbox._$selectedListControl);
         	
         	$sblistbox._$selectedListControl.init = function(items){
         		this.controller.clearItems();
         		if($sblistbox.settings.type == 'single'){
         			if(items != undefined && items.length > 0){
         				var singleItems = items.slice(0,1);
         				this.controller.addItems(singleItems);
         				this.setValue(singleItems);
         			}else{
         				this.setValue(items);
         			}
         		}else{
         			this.controller.addItems(items);
         			this.setValue(items);
         		}
         	};
         	
         	$sblistbox._$selectedListControl.setValue = function(items){
         		 if(items == undefined){
         			 $sblistbox._$selectedListControl.value = [];
         		 }else{
         			 $sblistbox._$selectedListControl.value = items;
         		 }
         	};
         	
         	$sblistbox._$selectedListControl.getValue = function(){
         		if(typeof $sblistbox._$selectedListControl.value == 'undefined'){
         			return [];
         		}
         		return $sblistbox._$selectedListControl.value;
         	};
      }
       
       /**
        * 构建按钮
        */
       function buildBtns(){
    	   if(isContainerModel()){
               return;   			
     	   }
    	   
    	   $sblistbox._$confirmBtnControl.bind("click", function(){
    		     var items = $sblistbox._$selectedListControl.controller.getCurrentPageItems();
         		 if(invokeCallback("onConfirm", [items])){
         			 var oldValue = $sblistbox.getValue();
         			 
             		 $sblistbox._$labelControl.setValue(items);
             		 $sblistbox._$selectedListControl.setValue(items);
             		 $.sbpopuplayer.hide($sblistbox._$container);
             		 
             		 //只有确定了才会触发onchagne
             		 var isChange = (oldValue.toString() !=  $sblistbox.getValue().toString());
					 if(isChange){
	             		 var selectItems = $sblistbox._$selectedListControl.getValue();
	             		 triggerOnChange(selectItems, "add", selectItems);
					 }
         		 }
         	});
         	
         	$sblistbox._$closeBtnControl.bind("click", function(){
         		 $.sbpopuplayer.hide($sblistbox._$container);
         	});
       }
       
       /**
        * 填充数据到控件中
        * 
        */
       function fillDatas(){
    	   if($sblistbox.settings.value !== undefined && $sblistbox.settings.value !== null){
    		   doSetValue($sblistbox.settings.value, function(){
    			   initComplete();
    			   triggerChangeWhenSetValue();
    		   });
    	   }else{
    		   initComplete();
    	   }
    	   
           if($sblistbox._$container.isFillDynamicDatas){
          	   fillDynamicDatas();
           }
       }
       
       /**
        * 填充动态数据
        */
       function fillDynamicDatas(){
    	   if($sblistbox.settings.readonly != true && $sblistbox.settings.disabled != true){
                querySelectableData(1);
            }
       }
       
        /**
		 * Main function
		 */
        return this.each(function () {
            render();
        });
        
    };
    
})(jQuery);/**
 * Loading status is a component that using in ajax invoked
 * to show a loading img mean ajax is requesting,please wait
 */
(function ($) {
    $.extend({
        sbloadingstatus: function (options) {
            var defaults = {
                className: "sinobest-loadingstatus",
                loadingClassName: "sinobest-loading",
                mode: "auto"
            };
            var settings = $.extend({}, defaults, options || {});
            var $this = this;

            /**
             * Add loading class to body
             */
            this.open = function () {
                $('body').addClass(settings.loadingClassName);
                // ajax
                $(document).on({
                    ajaxStop: function () {
                        $this.close();
                    }
                });
            };
            
            /**
             * 简单的打开,必须调用close方法关闭
             */
            this.simpleOpen = function(){
            	$('body').addClass(settings.loadingClassName);
            };

            /**
             * Remove loading class from body
             */
            this.close = function () {
                $('body').removeClass(settings.loadingClassName);
            };
			
			this.getClassName = function(){
				return defaults.className;
			};
            /**
             * Render component
             */
            function render() {
                buildContainer();
                addListener();
            };

            /**
             * Loading status component need a container,DOM span here
             */
            function buildContainer() {
                $this.$container = $("<span></span>").addClass(settings.className);
                $("body").append($this.$container);
            };
            /**
             * Usually,we use auto mode just
             */
            function addListener() {
                if (settings.mode == 'auto') {
                    $(document).on({
                        ajaxStart: function () {
                            $('body').addClass(settings.loadingClassName);
                        },
                        ajaxStop: function () {
                            $this.close();
                        }
                    });
                }
            };

            render();
            return this;
        }
    });

})(jQuery);/**
 * Sinobest-Numbertext:纯数字输入组件
 * 
 * Dependency:jquery.placeholder.js,accounting.js,sinobest-tools.js
 */
(function ($) {
    var defaults = {
        className:"sinobest-numbertext",
        required:false,
        placeholder:null,
        disabled:false,
        readonly:false,
        regex:null,
        callback:null,
        value:null,
        prefix:null,
        suffix:null,
        precision:"",
        decimalDelimiter:".",
        groupDelimiter:"",
        min:null,
        max:null,
        minlength:null,
        maxlength:null,
        onChange:null,
        autoCompletePrecision:true,  //自动用0补全小数位末尾
        onInitComplete:null,
        setValueTriggerChange:true
    };

    $.fn.sbnumbertext = function (options) {
        var $sbnumbertext = this;
        var settings;
        if(isContain()){
            if(options){
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({},getter().settings,options||{});
            }else{
                return getter();
            }
        }else{
            settings = $.extend({}, defaults, options || {});
        }

        $sbnumbertext.settings = settings;

        function getter(){
           return $sbnumbertext.data("$sbnumbertext");
        }
        
        function setter(){
            $sbnumbertext.data("$sbnumbertext",$sbnumbertext);
        }
        
        function isContain(){
            return $sbnumbertext.data("$sbnumbertext");
        }
        
        $.sbbase.mixinWidget($sbnumbertext);
        
        $sbnumbertext.getValue = function () {
        	var numberVal = $sbnumbertext.val();
        	if($.sbtools.isBlank(numberVal)){
        		return "";
        	}
        	if(numberVal === $sbnumbertext.settings.placeholder){
        		return "";
        	}
            return $.trim(unformatInputValue(numberVal));
        };
        
        
        $sbnumbertext.setValue = function (value) {
        	doSetValue(value, function(){
        		triggerChangeWhenSetValue();
        	});
            return $sbnumbertext;
        };
        
        function doSetValue(value, completeCallBack){
        	if($.sbtools.isBlank(value)){
        		$sbnumbertext.val("");
        		$sbnumbertext.settings.value = "";
        		if(completeCallBack){
        			completeCallBack();
        		}
        		return;
        	}
        	
        	//超过最大长度,不可以设置
        	//unformatInputValue是验证的时候保持值的干净,以免受前缀,后缀,小数位补0的影响
        	if(moreThanMaxLength(unformatInputValue(value))){
        		 return;
        	}
        	
            $sbnumbertext.val(formatInputValue(value));
            $sbnumbertext.settings.value = value;
            if(completeCallBack){
            	completeCallBack();
            }
        }
        
        function triggerChangeWhenSetValue(){
        	 if($.isFunction($sbnumbertext.settings.onChange) && $sbnumbertext.settings.setValueTriggerChange){
        		 $sbnumbertext.trigger("change");
             }
        }
        
        $sbnumbertext.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
                if (v !== undefined && v !== null) {
                    if (k == 'value') {
                        $sbnumbertext.setValue(v);
                    } else {
                        if (k == 'required') {
                            $sbnumbertext.settings.required = v;
                            $sbnumbertext.attr("required", v);
                        } else if (k == 'readonly') {
                            $sbnumbertext.settings.readonly = v;
                            $sbnumbertext.attr("readonly", v);
                            $.sbtools.toggleInputReadonlyClass($sbnumbertext, v);
                        } else if(k == 'disabled'){
                            $sbnumbertext.settings.disabled = v;
                            $sbnumbertext.attr("disabled", v);
                            $.sbtools.toggleInputDisabledClass($sbnumbertext, v);
                        } else{
                        	$sbnumbertext.attr(k, v);
                        }
                    }
                } else {
                    $sbnumbertext.removeAttr(k);
                }
            });
            return $sbnumbertext;
        };
		
        $sbnumbertext.getDefaultOptions = function(){
        	return defaults;
        };

        $sbnumbertext.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($sbnumbertext, "$sbnumbertext");
            return render();
        };
        
        $sbnumbertext.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                // basic validate
                var v = $sbnumbertext.getValue() + "";

                var isOk = false;
                if (settings.required) {
                    isOk = $.sbvalidator.required($sbnumbertext[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                
                if (settings.minlength) {
                    isOk = $.sbvalidator.minlength($sbnumbertext[0], v, settings.minlength);
                    if (!isOk) {
                        return $.sbvalidator.minLengthPromptMessage(settings.minlength);
                    }
                }
                
                if (settings.maxlength) {
                    isOk = $.sbvalidator.maxlength($sbnumbertext[0], v, settings.maxlength);
                    if (!isOk) {
                        return $.sbvalidator.maxLengthPromptMessage(settings.maxlength);
                    }
                }
                
                if (settings.regex && $.sbtools.isNotBlank(v)) {
                    isOk = $.sbvalidator.valid(settings.regex, v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REGEX;
                    }
                }
                return ""; //验证通过
            }
        };

        $sbnumbertext.getName = function(){
        	return $sbnumbertext.attr("name");
        };
        
        function initComplete(){
            $.sbtools.initController.initComplete($sbnumbertext, "$sbnumbertext", function(){
                if(!isContain()){
                    setter();
                }
            }, $sbnumbertext.settings.onInitComplete);
        }
        
        /**
         * Init
         */
        function render() {
        	$sbnumbertext.addClass($.sbtools.CONSTANTS.UICLASS.TEXT_COMMON);
            $sbnumbertext.addClass($sbnumbertext.settings.className);
            $sbnumbertext.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            $sbnumbertext.attr('required', $sbnumbertext.settings.required);
            
            if($sbnumbertext.settings.placeholder !== undefined && $sbnumbertext.settings.placeholder !== null) {
                $sbnumbertext.attr('placeholder', $sbnumbertext.settings.placeholder);
                // 测试是否支持
                if (!$.sbtools.isPlaceHolderSupported()) {
                    $sbnumbertext.placeholder();
                }
            }
            
            $sbnumbertext.attr('readonly', $sbnumbertext.settings.readonly);
            $.sbtools.toggleInputReadonlyClass($sbnumbertext, $sbnumbertext.settings.readonly);
            
            $sbnumbertext.attr('disabled', $sbnumbertext.settings.disabled);
            $.sbtools.toggleInputDisabledClass($sbnumbertext, $sbnumbertext.settings.disabled);
            
            bindNumberEvent();
            
            if($sbnumbertext.settings.value !== undefined && $sbnumbertext.settings.value !== null) {
                doSetValue($sbnumbertext.settings.value, function(){
                	initComplete();
                	triggerChangeWhenSetValue();
                });
            }else{
            	initComplete();
            }
            
            setter();
            return $sbnumbertext;
        }
        
        function bindNumberEvent(){
        	$sbnumbertext.on("keydown", function(e){
        		  if($sbnumbertext.settings.readonly){
        			  return;
        		  }
        		
        		  //配置最大长度,超过则不可以输入,记录上次满足条件的值
        		  if($sbnumbertext.settings.maxlength){
        			  if($.trim($sbnumbertext.getValue()).length <= $sbnumbertext.settings.maxlength){
            			  $sbnumbertext.lastValue = $sbnumbertext.getValue();
            		  }
        		  }
        		  
        	      var code	= (e.keyCode ? e.keyCode : e.which);
        	      //Backspace,Enter,Tab,Delete,Left,Right键通过
        	      if(code == 8 || code == 13 || code == 9 || code == 46 || code == 37 || code == 39) {
					  return true;
				  }
        	      
        	      //ctrl+c v a 通过
        	      if(e.ctrlKey === true && (code ==86 || code == 65 || code == 67)){
        	    	  return true;
        	      }

        	      var charFromCode =  getCharFromCode(code, e.shiftKey);
        	       
        	      if(e.shiftKey && !isDecimalDelimiterChar(charFromCode)){
        		     return false;
        	      }
        	 
        	      //负号只能作为第一个输入,存在前缀则必须在前缀的后面输入
        	      if(code == 189 && $(this).val().length >=1){
        	    	 if($(this).val().indexOf("-") > -1){
        	    		 return false;
        	    	 }
        	    	 
        	    	 if($sbnumbertext.settings.prefix){
        	    		 if($(this).val().indexOf($sbnumbertext.settings.prefix) > -1){
        	    			 if(getCursorPosition() !== 1){
            	    			 return false;
            	    		 }
        	    		 }else{
        	    			 if(getCursorPosition() !== 0){
            	    			 return false;
            	    		 }
        	    		 }
        	    	 }else{
        	    		 if(getCursorPosition() !== 0){
        	    			 return false;
        	    		 }
        	    	 }
        	      }
        	 
        	      //小数点分隔符不能作为首位且只能出现一次
        	      if(($(this).val().length === 0 && isDecimalDelimiterChar(charFromCode)) ||
        			   ($(this).val().indexOf(charFromCode) >= 0 && isDecimalDelimiterChar(charFromCode))){
        		     return false;
        	      }
        	      
                  if (isValidInputChar(code, charFromCode)){
        	          return true;
        	      } else {
        	          return false;
        	      }
           });
        	
           $sbnumbertext.on("keyup", function(e){
        	    if($sbnumbertext.settings.readonly){
     			   return;
     		    }
        	    processMoreThanMaxLength();
           });
        	
           $sbnumbertext.on("blur", function(){
        	     if($sbnumbertext.settings.readonly){
     			    return;
     		     }
        	   
            	 var val = $(this).val();
            	 if($.sbtools.isBlank(val)){
            		 return;
            	 }
            	 
            	 if($sbnumbertext.settings.min || $sbnumbertext.settings.min === 0){
            		 if(Number(val) < Number($sbnumbertext.settings.min)){
            			 val = $sbnumbertext.settings.min;
            		 }
            	 }
            	 
            	 if($sbnumbertext.settings.max || $sbnumbertext.settings.max === 0){
            		 if(Number(val) > Number($sbnumbertext.settings.max)){
            			 val = $sbnumbertext.settings.max;
            		 }
            	 }
            	 var formatVal =  formatInputValue(val);
            	 $(this).val(formatVal);
            });
           
           if($.isFunction($sbnumbertext.settings.onChange)){
        	  $sbnumbertext.on("change", function(){
        		   $sbnumbertext.settings.onChange.apply($sbnumbertext, [$sbnumbertext.getValue()]);
           	  });
           }
        }
        
        /**
         * 处理超过最大长度的问题
         */
        function processMoreThanMaxLength(){
		    if ($sbnumbertext.settings.maxlength) {
				var currentValue = $sbnumbertext.val();
				if($.sbtools.isBlank(currentValue)) {
					return;
				}

				if($sbnumbertext.settings.prefix) {
				   currentValue = currentValue.replace($sbnumbertext.settings.prefix, "");
				}

				if($sbnumbertext.settings.suffix) {
				   currentValue = currentValue.replace($sbnumbertext.settings.suffix, "");
				}

				if(moreThanMaxLength(currentValue)) {
					$sbnumbertext.setValue($sbnumbertext.lastValue);
				}
			}
        }
        
        /**
         * 超过最大长度
         */
        function moreThanMaxLength(value){
        	if($sbnumbertext.settings.maxlength){
        		if($.trim(value).length > $sbnumbertext.settings.maxlength) {
    				return true;
    			}
            	return false;
        	}
        	return false;
        }
        
        /**
         * 格式化输入的值
         */
        function formatInputValue(val){
        	var formatVal = "";
        	if($sbnumbertext.settings.prefix || $sbnumbertext.settings.suffix){
        		var prefix = $sbnumbertext.settings.prefix ?  $sbnumbertext.settings.prefix:"";
        		var suffix = $sbnumbertext.settings.suffix ? $sbnumbertext.settings.suffix:"";
        		formatVal = accounting.formatMoney(val, 
        				                      prefix,
        				                      $sbnumbertext.settings.precision, 
        				                      $sbnumbertext.settings.groupDelimiter, 
        				                      $sbnumbertext.settings.decimalDelimiter, 
        				                      "%s%v" + suffix);
        	}else{
        		formatVal = accounting.formatNumber(val,
        				                       $sbnumbertext.settings.precision, 
        				                       $sbnumbertext.settings.groupDelimiter, 
        				                       $sbnumbertext.settings.decimalDelimiter);
        	}
        	
        	if($sbnumbertext.settings.autoCompletePrecision){
               return formatVal;
            }else{
               return getRevokeAutoCompletePrecisionVal(formatVal);
            }
        }
        
        /**
         * 获取 撤销小数位末尾自动补全的0的值
         */
        function getRevokeAutoCompletePrecisionVal(formatVal){
        	if(formatVal == "" || formatVal === null || formatVal === undefined || $.trim(formatVal).length <= 0){
        		return formatVal;
        	}
        	
        	if($sbnumbertext.settings.precision == "" || $sbnumbertext.settings.precision == 0){
        		return formatVal;
        	}
        	
        	//不包含小数位分隔符,原样返回
        	var decimalIndex = formatVal.indexOf($sbnumbertext.settings.decimalDelimiter);
        	if(decimalIndex < 0){
        		return formatVal;
        	}
        	
        	var decimalPartLastIndex = formatVal.length;
        	if($sbnumbertext.settings.suffix){
        		decimalPartLastIndex = formatVal.indexOf($sbnumbertext.settings.suffix);
        	}
        	
        	//小数部分不包含小数位分隔符
        	var decimalPart = formatVal.substring(decimalIndex + 1, decimalPartLastIndex);
        	//小数部分不包含0,则原样返回
        	if(decimalPart.indexOf("0") < 0){
        		return formatVal;
        	}
        	
        	//除去末尾0的操作,整型的小数位间隔符号必须为标准的[.]
      		var numberDecimalPart = parseFloat("0." + decimalPart);
      		var revokeDecimalPart = "";
      		if(numberDecimalPart != 0){
      			revokeDecimalPart = (numberDecimalPart + "").substring((numberDecimalPart + "").indexOf(".") + 1);
      			revokeDecimalPart = $sbnumbertext.settings.decimalDelimiter  + revokeDecimalPart;
      		}
      		
      	    var basePart = formatVal.substring(0, decimalIndex);
     	    var suffixPart = "";
     	    if($sbnumbertext.settings.suffix){
     	    	suffixPart = formatVal.substring(formatVal.indexOf($sbnumbertext.settings.suffix));
     	    }
      	    return  basePart + revokeDecimalPart + suffixPart;
        }
        
        function unformatInputValue(val){
        	var unformatVal = accounting.unformat(val, $sbnumbertext.settings.decimalDelimiter);
        	//存在精度，但是返回的值没有精度，则补充完整
        	if($sbnumbertext.settings.precision && $sbnumbertext.settings.autoCompletePrecision){
        		return unformatVal.toFixed($sbnumbertext.settings.precision);
        	}else{
        		return unformatVal;
        	}
        }
        
        /**
         * 是否有效的输入字符
         */
        function isValidInputChar(code, charFromCode){
        	var isNumber = (code <= 57 && code >= 48) || (code <= 105 && code >= 96);
        	if(isNumber){
        		return true;
        	}
        	
        	var isMinus = (code == 189);
        	if(isMinus){
        		return true;
        	}
        	
        	if(isDecimalDelimiterChar(charFromCode)){
        		return true;
        	}
        	
        	return false;
        }
        
        /**
         * 是否精度输入字符
         */
        function isDecimalDelimiterChar(charFromCode){
        	return (charFromCode === $sbnumbertext.settings.decimalDelimiter);
        }
        
        function getCursorPosition(){
            var oTxt1 = $sbnumbertext[0];
            var cursurPosition=-1;
            if(oTxt1.selectionStart){//非IE浏览器
                cursurPosition= oTxt1.selectionStart;
            }else{//IE
                var range = document.selection.createRange();
                range.moveStart("character",-oTxt1.value.length);
                cursurPosition=range.text.length;
            }
            return cursurPosition;
        }

        var _keydown = {
    			codes : {
    				188 : 44,
    				109 : 45,
    				190 : 46,
    				191 : 47,
    				192 : 96,
    				220 : 92,
    				222 : 39,
    				221 : 93,
    				219 : 91,
    				173 : 45,
    				187 : 61, //IE Key codes
    				186 : 59, //IE Key codes
    				189 : 45, //IE Key codes
    				110 : 46  //IE Key codes
    	        },
    	        shifts : {
    				96 : "~",
    				49 : "!",
    				50 : "@",
    				51 : "#",
    				52 : "$",
    				53 : "%",
    				54 : "^",
    				55 : "&",
    				56 : "*",
    				57 : "(",
    				48 : ")",
    				45 : "_",
    				61 : "+",
    				91 : "{",
    				93 : "}",
    				92 : "|",
    				59 : ":",
    				39 : "\"",
    				44 : "<",
    				46 : ">",
    				47 : "?"
    	        }
    	};
        
        function getCharFromCode(code, shiftKey){
   		    var chara = '';
    		if (_keydown.codes.hasOwnProperty(code)) {
   	            code = _keydown.codes[code];
   	        }
   	        if (!shiftKey && (code >= 65 && code <= 90)){
   	        	code += 32;
   	        } else if (!shiftKey && (code >= 69 && code <= 105)){
   	        	code -= 48;
   	        } else if (shiftKey && _keydown.shifts.hasOwnProperty(code)){
   	            //get shifted keyCode value
   	            chara = _keydown.shifts[code];
   	        }
   	        if( chara === '' ){
   	        	chara = String.fromCharCode(code);
   	        }
   	        return chara;
   	    }
        
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Parser:通过html标签属性data-options配置来初始化控件
 * 
 * Dependency:sinobest-base.js  sinobest-tools.js
 */
(function ($) {
	
	$.extend({sbparser:{}});
	
    $.extend($.sbparser, {
    	auto: true,
		onComplete: function(context){},
		_pluginNamePrefix:"sb",
		parse: function(context){
			var _this = this;
			for(var i=0, length = $.sbbase.plugins.length; i < length; i++){
				var name = $.sbbase.plugins[i];
				var $plugins = $('.' + $.sbbase.pluginClassPrefix + name, context);
				if($plugins.length <= 0){
					continue;
				}
				
				$.each($plugins, function(){
					 var $plugin = $(this);
					 var dataOptions = $plugin.attr("data-options");
	            	 if(dataOptions === undefined){
	            		 return;
	            	 }
	            	 
	            	 var initFuncName = _this._pluginNamePrefix + name;
					 if ($plugin[initFuncName]){
						 if($.sbtools.isBlank(dataOptions)){
		            		 dataOptions = "{}";
		            	 }
						 var dataOptionsJson = eval("(" + dataOptions + ")");
						 
						 if($plugin[initFuncName]["onBeforeParser"]){
							 dataOptionsJson = $plugin[initFuncName]["onBeforeParser"](dataOptionsJson);
						 }
						 $plugin[initFuncName](dataOptionsJson);
					 }
				});
				
			}
			 
			$.sbparser.onComplete.call($.sbparser, context);
		}
    });
    
    //html标签初始化解析
    $(function(){
		if($.sbparser.auto){
			$.sbparser.parse();
		}
	});
})(jQuery);/**
 * Sinobest-Password:密码组件
 * 
 * Dependency:sinobest-tools.js
 */
(function ($) {
    var defaults = {
        className:"sinobest-password", 
        required:false,  
        minlength:null,  
        maxlength:null,  
        disabled:false,
        readonly:false,
        regex:null,
        callback:null,
        value:null,
        onChange:null,
        onInitComplete:null,
        setValueTriggerChange:true
    };

    $.fn.sbpassword = function (options) {
        var $sbpassword = this;
        var settings;
        if(isContain()){
            if(options){
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({},getter().settings,options||{});
            }else{
                return getter();
            }
        }else{
            settings = $.extend({}, defaults, options || {});
        }

        $sbpassword.settings = settings;
       
        function getter(){
           return $sbpassword.data("$sbpassword");
        }
       
        function setter(){
            $sbpassword.data("$sbpassword",$sbpassword);
        }
        
        function isContain(){
            return $sbpassword.data("$sbpassword");
        }
        
        $.sbbase.mixinWidget($sbpassword);
        
        $sbpassword.getValue = function () {
            return $.trim($sbpassword.val());
        };

        $sbpassword.setValue = function (value) {
            doSetValue(value, function(){
            	triggerChangeWhenSetValue();
            });
            return $sbpassword;
        };
        
        function doSetValue(value, completeCallBack){
        	$sbpassword.val(value);
            $sbpassword.settings.value = value;
            if(completeCallBack){
            	completeCallBack();
            }
        }
        
        function triggerChangeWhenSetValue(){
        	if($.isFunction($sbpassword.settings.onChange) && $sbpassword.settings.setValueTriggerChange){
               	$sbpassword.trigger("change");
             }
        }
        
        $sbpassword.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null) {
                    if (k == 'value') {
                        $sbpassword.setValue(v);
                    } else {
                        if (k == 'required') {
                            $sbpassword.settings.required = v;
                        } else if (k == 'readonly') {
                            $sbpassword.settings.readonly = v;
                            $.sbtools.toggleInputReadonlyClass($sbpassword, v);
                        } else if(k == 'disabled'){
                            $sbpassword.settings.disabled = v;
                            $.sbtools.toggleInputDisabledClass($sbpassword, v);
                        }
                        $sbpassword.attr(k, v);
                    }
                } else {
                    $sbpassword.removeAttr(k);
                }
            });
            return $sbpassword;
        };
		
        $sbpassword.getDefaultOptions = function(){
        	return defaults;
        };

        $sbpassword.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($sbpassword, "$sbpassword"); 
            return render();
        };
        
        $sbpassword.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                // basic validate
                var v = $sbpassword.getValue();
                var isOk = false;
                
                if (settings.required) {
                    isOk = $.sbvalidator.required($sbpassword[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                
                if (settings.minlength) {
                    isOk = $.sbvalidator.minlength($sbpassword[0], v, settings.minlength);
                    if (!isOk) {
                        return $.sbvalidator.minLengthPromptMessage(settings.minlength);
                    }
                }
                
                if (settings.maxlength) {
                    isOk = $.sbvalidator.maxlength($sbpassword[0], v, settings.maxlength);
                    if (!isOk) {
                        return  $.sbvalidator.maxLengthPromptMessage(settings.maxlength);
                    }
                }
                
                if (settings.regex && $.sbtools.isNotBlank(v)) {
                    isOk = $.sbvalidator.valid(settings.regex, v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REGEX;
                    }
                }
                return ""; //验证通过
            }
        };

        $sbpassword.getName = function(){
        	return $sbpassword.attr("name");
        };
        
        function initComplete(){
            $.sbtools.initController.initComplete($sbpassword, "$sbpassword", function(){
                if(!isContain()){
                    setter();
                }
            },  $sbpassword.settings.onInitComplete);
        }
        
        function render() {
        	$sbpassword.addClass($.sbtools.CONSTANTS.UICLASS.TEXT_COMMON);
            $sbpassword.addClass($sbpassword.settings.className);
            $sbpassword.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            $sbpassword.attr('required', $sbpassword.settings.required);
            
            $sbpassword.attr('readonly', $sbpassword.settings.readonly);
            $.sbtools.toggleInputReadonlyClass($sbpassword, $sbpassword.settings.readonly);
            
            $sbpassword.attr('disabled', $sbpassword.settings.disabled);
            $.sbtools.toggleInputDisabledClass($sbpassword, $sbpassword.settings.disabled);
            
            if($.isFunction($sbpassword.settings.onChange)){
            	$sbpassword.on("change", function(){
            		$sbpassword.settings.onChange.apply($sbpassword, [$sbpassword.getValue()]);
            	});
            }
            
            $.sbtools.registerBaseEvent($sbpassword, $sbpassword.settings);
            
            if ($sbpassword.settings.value !== undefined && $sbpassword.settings.value !== null) {
                doSetValue($sbpassword.settings.value, function(){
                	initComplete();
                	triggerChangeWhenSetValue();
                });
            }else{
            	initComplete();
            }
            
            setter();
            return $sbpassword;
        }

        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Personselect:人员选择组件
 * 
 * Dependency:sinobest.popuplayer.js,sinobest.listbox.js,sinobest.tools.js
 */
(function($) {

	var defaults = {
		id : null,
		name : null,
		value : null,
		mode : "popupList", //popupList/groupList  弹出列表选择方式/分组列表选择方式
		colModel : null,
		valueField : "code",
		labelField : "detail",
		url : null,
		queryUrl : null,
		pageSize : 20,
		searchField : [ "detail" ],
		selectContainerWidth : null,
		selectContainerHeight : null,
		selectListWidth : null,
		selectListHeight : null,
		otherRequestParam : null,
		type : "multiple",
		style : null,
		className : "sinobest-personselect",
		required : false,
		readonly : false,
		disabled : false,
		callback : null,
		onItemAdd : null,
		onItemRemove : null,
		onConfirm : null,
		maxShowGroupSize:7,
		delimiter:null,
		onAjaxRequest: null, 
		onAjaxResponse: null,
		pageConfig:{
            pageField:"page",
            pageSizeField:"pageSize",
            queryField:"query",
            totalCountField:"totalCount",
            pageCountField:"pageCount",
            searchField:"searchField",
            sortField:"sortField",
            sortOrderField:"sortOrder",
            dataField:"data",
            orgField:"org",
            divisionField:"division"
       },
       saveType:"c",
       transUrl:null,
       onTranslateRequest:null,
       onTranslateResponse:null,
       translateCallback:null,
       paramFieldConfig:{
    	   orgIdField:"id",
    	   orgPidField:"pId",
    	   orgNameField:"name",
    	   orgDataField:"orgData",
    	   divisionDataField:"divisionData",
    	   divisionCodeField:"code",
    	   divisionDetailField:"detail"
       },
       onChange:null,
       onInitComplete:null,
       enableQuery:true,
       enableDivision:true,
       setValueTriggerChange:true
	};

	$.fn.sbpersonselect = function(options) {
		 var settings;
		 var $sbpersonselect = this;
	     if (isContain()) {
	          if (options) {
	         	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter(); 
	          } else {
	             return getter();
	          }
	     } else {
	          settings = $.extend(true, {}, defaults, options || {});
	     }
	     $sbpersonselect.settings = settings;

	     function getter() {
	         return $sbpersonselect.data("$sbpersonselect");
	     }

	     function setter() {
	    	 $sbpersonselect.data("$sbpersonselect", $sbpersonselect);
	     }
	        
	     function isContain() {
	         return $sbpersonselect.data("$sbpersonselect");
	     }
	     
	     $.sbbase.mixinWidget($sbpersonselect);

		/**
		 * 获取控件的值
		 */
		$sbpersonselect.getValue = function() {
			return $sbpersonselect.control.getValue();
		};
		
		$sbpersonselect.getLabel = function(){
			return $sbpersonselect.control.getLabel();
		};

		/**
		 * 设置控件的值：vaue值是数组或者
		 */
		$sbpersonselect.setValue = function(value) {
			doSetValue(value, function(){
				triggerChangeWhenSetValue();
			});
		};
		
		function doSetValue(value, completeCallBack){
			var convertvalue = $.sbtools.convertSetValue(value);
			if($.isArray(convertvalue) || $.sbtools.isBlank(convertvalue)){
				 processActualSetValue(convertvalue, completeCallBack, value);
			}else{
				$.sbbase.translateController.translate($sbpersonselect, {"value":convertvalue}, function(items){
					processActualSetValue(items, completeCallBack, value);
              	});
			}
		}
		
		function processActualSetValue(items, completeCallBack, value){
			$sbpersonselect.control.setValue(items);
			$sbpersonselect.settings.value = value;
			
			if(completeCallBack && $.isFunction(completeCallBack)){
				completeCallBack();
        	}
        }
		
		function triggerChangeWhenSetValue(){
			if($.isFunction($sbpersonselect.settings.onChange) && $sbpersonselect.settings.setValueTriggerChange){
        	    var selectItems = $sbpersonselect.getSelectItems();
        	    invokeCallback("onChange", [selectItems, "add", selectItems]);
            }
		}
		
		/**
		 * 设置控件的状态
		 */
		$sbpersonselect.setState = function(stateJson) {
			$.each(stateJson, function(k, v) {
				if (v !== undefined && v !== null)  {
					if (k == 'value') {
						$sbpersonselect.setValue(v);
					} else {
						if (k == 'required') {
							$sbpersonselect.settings.required = v;
							$sbpersonselect.control.getLabelControl().attr("required", v);
						} else if (k == 'disabled') {
							$sbpersonselect.settings.disabled = v;
							$sbpersonselect.control.getLabelControl().attr("disabled", v);
							$.sbtools.toggleInputDisabledClass($sbpersonselect.control.getLabelControl(), v);
						} else if (k == 'readonly') {
							$sbpersonselect.settings.readonly = v;
							$.sbtools.toggleInputReadonlyClass($sbpersonselect.control.getLabelControl(), v);
						} else{
							$sbpersonselect.attr(k, v);
						}
					}
				} else {
					$sbpersonselect.removeAttr(k);
				}
			});
			return $sbpersonselect;
		};
		
        $sbpersonselect.getDefaultOptions = function(){
        	return defaults;
        };

		/**
		 * 重新加载控件
		 */
		$sbpersonselect.reload = function() {
			//因为将容器 [GroupListControl会追加到body]追加到body中,所以此处需要通过调用将容器从body中移除
			$sbpersonselect.control.removeContainer();
			$sbpersonselect.empty();
			$.sbtools.initController.removeInitCompleteFlag($sbpersonselect, "$sbpersonselect");
			render();
		};

		$sbpersonselect.load = function(dataSource, queryUrlDataSource){
			$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
			$.sbtools.isInPseudoProtocolBlackList(queryUrlDataSource, true);
			
			var urlDsFlag = $.sbtools.isNonNull(dataSource);
			var queryUrlDsFlag =$.sbtools.isNonNull(queryUrlDataSource);
        	if(urlDsFlag || queryUrlDsFlag){
        		if(urlDsFlag){
        		    $sbpersonselect.settings.url = dataSource;
        		}
        		if(queryUrlDsFlag){
        			$sbpersonselect.settings.queryUrl = queryUrlDataSource;
        		}
       		    $sbpersonselect.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };

		/**
		 * 销毁控件
		 */
		$sbpersonselect.destroy = function() {
			$sbpersonselect.control.removeContainer();
			$sbpersonselect.remove();
		};

		/**
		 * 控件的验证
		 */
		$sbpersonselect.validate = function() {
			if ($.isFunction($sbpersonselect.settings.callback)) {
				return this.settings.callback.apply(this, [this.settings, this.getValue()]);
			} else {
				if (settings.required) {
					var isOk = $.sbvalidator.required($sbpersonselect.control.getLabelControl()[0], $sbpersonselect.getValue());
					if (!isOk) {
						return $.sbvalidator.TEXT_REQUIRED;
					}
				}
				return "";
			}
		};

		/**
		 * 获取控件的名称
		 */
		$sbpersonselect.getName = function(){
			return $sbpersonselect.settings.name;
		};
		
	 	$sbpersonselect.getSelectItems = function(){
			return $sbpersonselect.control.getSelectItems();
		}
		
		function initComplete(){
            $.sbtools.initController.initComplete($sbpersonselect, "$sbpersonselect", function(){
                if(!isContain()){
                    setter();
                }
            }, $sbpersonselect.settings.onInitComplete);
        }

		/**
		 * Init
		 */
		function render() {
			$sbpersonselect.addClass($sbpersonselect.settings.className);
			$sbpersonselect.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
			
			if ($sbpersonselect.settings.id === null) {
				$sbpersonselect.settings.id = $sbpersonselect.attr("id") + "_personselect";
			}

			$sbpersonselect.control = null;
			if($sbpersonselect.settings.mode == "popupList"){
				$sbpersonselect.control = new PopupListControl();
			}else if($sbpersonselect.settings.mode == "groupList"){
				$sbpersonselect.control = new GroupListControl();
			}else{
				throw new Error("mode=" + $sbpersonselect.settings.mode + " does not support");
			}
			
			$sbpersonselect.control.render();
			
			setter();
			return $sbpersonselect;
		}
		
		/**
		 * 调用回调函数
		 * @param functionName 函数名
		 * @param args         参数数组
		 */
	    function invokeCallback(functionName, args) {
			if (typeof $sbpersonselect.settings[functionName] == 'function') {
				var result = $sbpersonselect.settings[functionName].apply($sbpersonselect, args);
				return result === undefined ? true : result;
			}
			return true;
		}

		/**
		 * 弹出div层列表选择
		 */
		var PopupListControl = function() {
		};

		PopupListControl.prototype = {
		    /**
		     * 渲染组件
		     */
			render: function() {
				this._renderLabelArea();
				this._renderSelectContainerArea();
				this._renderSimpleSingle();
				this._buildPersonSelect();
			},

			removeContainer: function(){
				$sbpersonselect._$container.remove();
			},
			
			/**
			 * 获取组件的值
			 * @returns
			 */
			getValue: function(){
				var value = $sbpersonselect._$selectControl.getValue();
				if($sbpersonselect.settings.delimiter && $.isArray(value)){
	        		return value.join($sbpersonselect.settings.delimiter);
	        	}
				return value;
			},
			
			getLabel: function(){
				var label = $sbpersonselect._$selectControl.getLabel();
				if($sbpersonselect.settings.delimiter && $.isArray(label)){
	        		return label.join($sbpersonselect.settings.delimiter);
	        	}
				return label;
			},
			
			/**
			 * 设置组件的值
			 * @param value
			 */
			setValue: function(value){
				$sbpersonselect._$labelControl.setValue(value);
				$sbpersonselect._$selectControl.setValue(value);
			},
			
			/**
			 * 获取标签控件
			 * @returns Jquery Object
			 */
			getLabelControl: function(){
				return $sbpersonselect._$labelControl;
			},
			
			getSelectItems: function(){
				return $sbpersonselect._$selectControl.getSelectItems();
			},
			
			/**
			 * 渲染标签区域
			 */
			_renderLabelArea: function() {
				var $text = $('<input type="text" readonly></input>');
				$text.addClass($.sbtools.CONSTANTS.UICLASS.TEXT_COMMON);
				if ($sbpersonselect.settings.id) {
					$text.attr("id", $sbpersonselect.settings.id);
				}
				if ($sbpersonselect.settings.name) {
					$text.attr("name", $sbpersonselect.settings.name);
				}
				if ($sbpersonselect.settings.style) {
					$text.attr("style", $sbpersonselect.settings.style);
				}
				
				$text.attr("disabled", $sbpersonselect.settings.disabled);
				$.sbtools.toggleInputDisabledClass($text, $sbpersonselect.settings.disabled);
				
				$.sbtools.toggleInputReadonlyClass($text, $sbpersonselect.settings.readonly);

				$sbpersonselect.append($text);
				$sbpersonselect._$labelControl = $text;
			},

			/**
			 * 渲染人员选择区域容器
			 */
			_renderSelectContainerArea: function() {
				var $container = $('<div class="sinobest-perselect-container sinob-widget-container"></div>');
				$.sbpopuplayer.registerPopup($container);

				$container.append(this._renderOrgAndDivisionArea());
				$container.append(this._renderSelectArea());
				$container.append(this._renderBtnsArea());

				//$sbpersonselect.append($container);
				if($sbpersonselect.attr("id")){
					$container.attr("id", $sbpersonselect.attr("id") + "_personselect_container");
				}else{
					if($sbpersonselect.settings.id){
						$container.attr("id", $sbpersonselect.settings.id + "_personselect_container");
					}
				}
				$(document.body).append($container);
				
				$sbpersonselect._$container = $container;
			},

			/**
			 * 渲染组组织机构区域和区划
			 */
			_renderOrgAndDivisionArea: function() {
				var $orgAndDivision = $('<div class="sinobest-perselect-org-division"></div>');
				
				var $orgArea = this._renderOrgArea();
				$orgAndDivision.append($orgArea);
				var $divisionArea = this._renderDivisionArea();
				$orgAndDivision.append($divisionArea);
				
				//是否开启区划功能
				if(!$sbpersonselect.settings.enableDivision){
					$divisionArea.hide();
					$orgArea.addClass("sinobest-perselect-only-org");
				}
				return $orgAndDivision;
			},

			/**
			 * 渲染组织机构区域
			 */
			_renderOrgArea: function() {
				var $org = $('<div class="sinobest-perselect-org"></div>');
				var $orgContainer = $('<div class="ztree"></div>');

				$org.append($orgContainer);
				$sbpersonselect._$orgControl = $orgContainer;
				return $org;
			},

			/**
			 * 渲染区划区域
			 */
			_renderDivisionArea: function() {
				var $division = $('<div class="sinobest-perselect-division"></div>');
				var $divisionContainer = $('<table class="sinobest-perselect-division-table"></table>');

				$division.append($divisionContainer);
				//区划控件
				$sbpersonselect._$divisionControl = $divisionContainer;
				
				return $division;
			},

			/**
			 * 渲染选择区域
			 */
			_renderSelectArea: function() {
				var $select = $('<div class="sinobest-perselect-select-container"></div>');

				var listboxConfig = {
					mode : "container",
					url : $sbpersonselect.settings.queryUrl,
					colModel : $sbpersonselect.settings.colModel,
					valueField : $sbpersonselect.settings.valueField,
					labelField : $sbpersonselect.settings.labelField,
					searchField : $sbpersonselect.settings.searchField,
					width : $sbpersonselect.settings.selectContainerWidth,
					height : $sbpersonselect.settings.selectContainerHeight,
					listWidth : $sbpersonselect.settings.selectListWidth,
					listHeight : $sbpersonselect.settings.selectListHeight,
					type : $sbpersonselect.settings.type,
					otherRequestParam : $sbpersonselect.settings.otherRequestParam,
					pageSize : $sbpersonselect.settings.pageSize,
					onItemAdd : function(items) {
						return invokeCallback("onItemAdd", [items]);
					},
					onItemRemove : function(items) {
						return invokeCallback("onItemRemove", [items]);
					},
					onConfirm : function(items) {
						return invokeCallback("onConfirm", [items]);
					},
					pageConfig:$sbpersonselect.settings.pageConfig,
					saveType:$sbpersonselect.settings.saveType,
					/*onChange : function(currentItem, oper, selectedItems){
						return invokeCallback("onChange", [currentItem, oper, selectedItems]);
					},*/
					enableQuery:$sbpersonselect.settings.enableQuery,
					enableSimpleSingleModel:($sbpersonselect.settings.type === "single"),
					setValueTriggerChange:$sbpersonselect.settings.setValueTriggerChange
				};

				$sbpersonselect._$selectControl = $select.sblistbox(listboxConfig);
				//内嵌的listbox不视为独立的控件,不增加sinobest-ui的class
				$sbpersonselect._$selectControl.removeClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
				return $select;
			},

			/**
			 * 渲染按钮区域
			 */
			_renderBtnsArea: function() {
				var $btns = $('<div class="sinobest-perselect-btns"></div>');

				var $confirmBtn = $('<input type="button" value="确定" class="sinobest-button-common sinobest-perselect-btns-confirmbtn"></input>');
				var $closeBtn = $('<input type="button" value="关闭"   class="sinobest-button-common sinobest-perselect-btns-closebtn"></input>');

				$btns.append($confirmBtn).append($closeBtn);

				$sbpersonselect._btnsContainer = $btns;
				$sbpersonselect._$confirmBtnControl = $confirmBtn;
				$sbpersonselect._$closeBtnControl = $closeBtn;
				return $btns;
			},
			
			_renderSimpleSingle: function(){
				if($sbpersonselect.settings.type !== "single"){
					return;
	            }
				$sbpersonselect._$container.addClass("sinobest-perselect-container-single");
				
				var $clearBtn = $('<input type="button" value="清除"   class="sinobest-button-common sinobest-perselect-btns-clearbtn"></input>');
				$sbpersonselect._btnsContainer.append($clearBtn);
				$sbpersonselect._$clearBtnControl = $clearBtn;
			},

			_buildPersonSelect: function() {
				//未点击弹出对话框前，不需要填充的数据的标示:如远程请求的数据。
				$sbpersonselect._$container.isFillDynamicDatas = false;
				this._buildLabel();
				this._buildOrgAndDivision();
				this._buildSelect();
				this._buildBtns();
				this._buildSimpleSingle();
				
				this._fillDatas();
			},
			
			/**
			 * 构建标签控件
			 */
			_buildLabel: function() {
				var _this = this;
				$sbpersonselect._$labelControl.bind("click", function() {
					if ($sbpersonselect.settings.readonly) {
						return;
					}
					
					if($sbpersonselect._$container.is(":visible")){
						return;
					}
					
					if (!$sbpersonselect._$container.isFillDynamicDatas) {
						_this._fillDynamicDatas();
						$sbpersonselect._$container.isFillDynamicDatas = true;
					}
					$.sbpopuplayer.popup($sbpersonselect._$container);
				});

				$sbpersonselect._$labelControl.setValue = function(items) {
					if (items !== undefined && items.length > 0) {
						var labelValue = "";
						if ($sbpersonselect.settings.type == 'single') {
							labelValue += items[0][$sbpersonselect.settings.labelField];
						} else {
							for (var i = 0, length = items.length; i < length; i++) {
								labelValue += items[i][$sbpersonselect.settings.labelField];
								if (i != items.length - 1) {
									labelValue += ";";
								}
							}
						}
						this.val(labelValue);
						this.attr("title", labelValue);
					} else {
						this.val("");
						this.attr("title", "");
					}
				};
			},

			/**
			 * 构建组织机构和区划
			 */
			_buildOrgAndDivision: function() {
				this._buildOrg();
				this._buildDivision();
			},

			/**
			 * 构建组织机构
			 */
			_buildOrg: function() {
				$sbpersonselect._$orgControl.addSelectListener = function(listener) {
					this.selectListener = listener;
				};

				$sbpersonselect._$orgControl.onSelect = function(orgs) {
					if (this.selectListener !== null && this.selectListener !== undefined) {
						this.selectListener.onOrgSelect(orgs);
					}
				};

				$sbpersonselect._$orgControl.init = function(orgData) {
					var setting = {
						data : {
							simpleData : {
								enable : true,
								idKey: $sbpersonselect.settings.paramFieldConfig.orgIdField,
								pIdKey:$sbpersonselect.settings.paramFieldConfig.orgPidField
							},
							key:{
								name:$sbpersonselect.settings.paramFieldConfig.orgNameField
							}
						},
						callback : {
							onClick : function(event, treeId, treeNode) {
								var orgs = [];
								orgs.push(treeNode[$sbpersonselect.settings.paramFieldConfig.orgIdField]);
								$sbpersonselect._$orgControl.onSelect(orgs);
							}
						}
					};
					
					var ztreeObj = $.fn.zTree.init($sbpersonselect._$orgControl, setting, orgData);
					var nodes = ztreeObj.getNodes();
					if (nodes !== undefined && nodes !== null) {
						for (var i = 0, length = nodes.length; i < length; i++) {
							ztreeObj.expandNode(nodes[i], true, false, true, true);
						}
					}
				};
			},

			/**
			 * 构建区划
			 */
			_buildDivision: function() {
				$sbpersonselect._$divisionControl.addSelectListener = function(listener) {
					this.selectListener = listener;
				};

				$sbpersonselect._$divisionControl.onSelect = function(divisions) {
					if (this.selectListener !== null && this.selectListener !== undefined) {
						this.selectListener.onDivisionSelect(divisions);
					}
				};

				$sbpersonselect._$divisionControl.init = function(divisionData) {
					if (divisionData === null || divisionData === undefined) {
						return;
					}

					//单元格的列数
					var gridColumn = 3;
					var $tr = $();
					for (var i = 0, length = divisionData.length; i < length; i++) {
						var division = divisionData[i];
						if (i % gridColumn == 0) {
							$tr = $('<tr></tr>');
							$sbpersonselect._$divisionControl.append($tr);
						}

						var $td = $('<td></td>');
						var $checkBox = $('<input type="checkbox"></input>');
						$checkBox.val(division[$sbpersonselect.settings.paramFieldConfig.divisionCodeField]);
						$td.append($checkBox).append(division[$sbpersonselect.settings.paramFieldConfig.divisionDetailField]);
						$tr.append($td);
					}

					//绑定事件
					$sbpersonselect._$divisionControl.find("input:checkbox").bind("click",function() {
										var result = [];
										$sbpersonselect._$divisionControl.find("input:checkbox").each(function() {
															if ($(this).is(":checked")) {
																result.push($(this).attr("value"));
															}
														});
										$sbpersonselect._$divisionControl.onSelect(result);
									});

				};
			},

			/**
			 * 构建选择
			 */
			_buildSelect: function() {
				var _this = this;
				//监听组织机构变化
				$sbpersonselect._$selectControl.onOrgSelect = function(orgs) {
					$sbpersonselect._$selectControl.orgs = orgs;
					_this._loadSelectControlData();
				};
				$sbpersonselect._$orgControl.addSelectListener($sbpersonselect._$selectControl);

				//监听区划控件的变化
				$sbpersonselect._$selectControl.onDivisionSelect = function(divisions) {
					$sbpersonselect._$selectControl.divisions = divisions;
					_this._loadSelectControlData();
				};
				$sbpersonselect._$divisionControl.addSelectListener($sbpersonselect._$selectControl);

				$sbpersonselect._$selectControl.getOrgs = function() {
					if (typeof $sbpersonselect._$selectControl.orgs == 'undefined'
							|| $sbpersonselect._$selectControl.orgs == null) {
						return "";
					}

					return $sbpersonselect._$selectControl.orgs.join(";");
				};

				$sbpersonselect._$selectControl.getDivisions = function() {
					if (typeof $sbpersonselect._$selectControl.divisions == 'undefined'
							|| $sbpersonselect._$selectControl.divisions == null) {
						return "";
					}
					return $sbpersonselect._$selectControl.divisions.join(";");
				};

			},

			/**
			 * 加载选择控件的值
			 */
			_loadSelectControlData: function() {
				var requestParam = {};
				requestParam[$sbpersonselect.settings.pageConfig.orgField] = $sbpersonselect._$selectControl.getOrgs();
				requestParam[$sbpersonselect.settings.pageConfig.divisionField] = $sbpersonselect._$selectControl.getDivisions();
				$sbpersonselect._$selectControl.loadData(requestParam);
			},

			/**
			 * 构建按钮
			 */
			_buildBtns: function() {
				$sbpersonselect._$confirmBtnControl.bind("click", function() {
					var items = $sbpersonselect._$selectControl.getSelectedPageItems();
					if (invokeCallback("onConfirm", [items])) {
						var oldValue = $sbpersonselect.getValue();
						
						$sbpersonselect._$labelControl.setValue(items);
						$sbpersonselect._$selectControl.setValue(items);
						$.sbpopuplayer.hide($sbpersonselect._$container);
						
						//只有确定了才会触发onchagne
	             		var isChange = (oldValue.toString() !=  $sbpersonselect.getValue().toString());
						if(isChange){
		             		var selectItems = $sbpersonselect._$selectControl.getSelectItems();
		  	        	    invokeCallback("onChange", [selectItems, "add", selectItems]);		             		 
						}
					}
				});

				$sbpersonselect._$closeBtnControl.bind("click", function() {
					$.sbpopuplayer.hide($sbpersonselect._$container);
				});
			},

			_buildSimpleSingle: function(){
				if($sbpersonselect.settings.type !== "single"){
				   return;
				}	
				//触发删除事件
			    $sbpersonselect._$clearBtnControl.bind("click", function() {
					  var items = $sbpersonselect._$selectControl.getSelectedPageItems();
					  if(items === undefined || items.length <= 0){
						 return;
					  }
						  
					  if(invokeCallback("onItemRemove", [items])) {
					       invokeCallback("onChange", [items, "remove", items]);
					    	  
					       $sbpersonselect._$labelControl.setValue([]);
						   $sbpersonselect._$selectControl.setValue([]);
						   $.sbpopuplayer.hide($sbpersonselect._$container);
				      }
				 });
			},
			
			/**
			 * 填充数据到控件中
			 * 
			 */
			_fillDatas: function() {
				if($sbpersonselect.settings.value !== undefined && $sbpersonselect.settings.value !== null){
					doSetValue($sbpersonselect.settings.value, function(){
		    			 initComplete();
		    			 triggerChangeWhenSetValue();
		    		});
				}else{
					initComplete();
				}
				
				if ($sbpersonselect._$container.isFillDynamicDatas) {
					this._fillDynamicDatas();
				}
			},

			/**
			 * 填充动态数据
			 */
			_fillDynamicDatas: function() {
				if ($sbpersonselect.settings.readonly != true && $sbpersonselect.settings.disabled != true) {
					this._fillOrgAndDivisionData();
					this._loadSelectControlData();
				}
			},

			/**
			 * 填充组织机构和区划数据
			 */
			_fillOrgAndDivisionData: function() {
				var request = {};
				$.extend(request, $sbpersonselect.settings.otherRequestParam|| {});
				
				if($sbpersonselect.settings.onAjaxRequest && $.isFunction($sbpersonselect.settings.onAjaxRequest)){
					request = ($sbpersonselect.settings.onAjaxRequest)(request);
		        }
				$.ajax({
							type : "post",
							contentType : "application/json; charset=utf-8",
							dataType : "json",
							data : JSON.stringify(request),
							url : $sbpersonselect.settings.url,
							success : function(dataResponse) {
								if($sbpersonselect.settings.onAjaxResponse 
										 && $.isFunction($sbpersonselect.settings.onAjaxResponse)){
			  						 ($sbpersonselect.settings.onAjaxResponse)(dataResponse);
			  					}
								$sbpersonselect._$orgControl.init(dataResponse[$sbpersonselect.settings.paramFieldConfig.orgDataField]);
								$sbpersonselect._$divisionControl.init(dataResponse[$sbpersonselect.settings.paramFieldConfig.divisionDataField]);
							},
							error : function(XMLHttpRequest, textStatus, errorThrown) {
								var e = {};
								e.code = XMLHttpRequest.status;
								e.msg = $.sberror.format(e.code, this.url);
								$.sberror.onError(e);
							}
						});
			}
		};

		/**
		 * 分组列表选择控件
		 */
		var GroupListControl = function() {
		};
		
		/**
		 * 隐藏容器
		 */
		function hideContainer(){
			$sbpersonselect._$container.fadeOut("fast");
			$("html").unbind("mousedown", sinobestPersonselect2OnBodyDown);
		};
		
		function sinobestPersonselect2OnBodyDown(event){
			if (!(event.target.id == $sbpersonselect._$labelControl.attr("id")
					  || $(event.target).hasClass("sinobest-perselect-group-container")
					  || $(event.target).parents("div.sinobest-perselect-group-container").length > 0)) {
				hideContainer();
			}
		};
		
		GroupListControl.prototype = {
				
				 /**
			     * 渲染组件
			     */
				render: function() {
					this._renderLabelArea();
					this._renderSelectContainerArea();
					this._buildPersonSelect();
				},
				
				removeContainer: function(){
					$sbpersonselect._$container.remove();
				},
				
				/**
				 * 获取组件的值
				 * @returns
				 */
				getValue: function(){
					return this._getSelectedValues($sbpersonselect.settings.saveType);
				},
				
				/**
				 * 根据类型获取选择的值
				 * @param type
				 * @returns
				 */
				_getSelectedValues : function(type){
					var selectedItems =  $sbpersonselect._$groupSelectControl.getValue();
		        	var values = [];
		        	
		        	if(type == "c"){
		        		for(var i = 0, length = selectedItems.length; i < length; i++){
		            		values.push(selectedItems[i][$sbpersonselect.settings.valueField]);
		            	}
		        	}else{
		        		for(var j = 0, jlength = selectedItems.length; j < jlength; j++){
		            		values.push(selectedItems[j][$sbpersonselect.settings.labelField]);
		            	}
		        	}
		        	
		        	if($sbpersonselect.settings.delimiter){
		        		return values.join($sbpersonselect.settings.delimiter);
		        	}
		        	if($sbpersonselect.settings.type == "single"){
		        		return values.length > 0 ? values[0]:"";
		        	}
		        	return values;
				},
				
				getLabel: function(){
					return this._getSelectedValues("d");
				},
				
				/**
				 * 设置组件的值
				 * @param value
				 */
				setValue: function(value){
					$sbpersonselect._$labelControl.setValue(value);
					
					$sbpersonselect._$groupSelectControl.clearSelectedItems();
					$sbpersonselect._$groupSelectControl.setItemsSelected(value);
					$sbpersonselect._$groupSelectControl.setValue(value);
				},
				
				/**
				 * 获取标签控件
				 * @returns Jquery Object
				 */
				getLabelControl: function(){
					return $sbpersonselect._$labelControl;
				},
				
				getSelectItems: function(){
					return $sbpersonselect._$groupSelectControl.getValue();
				},
				
				/**
				 * 渲染标签区域
				 */
				_renderLabelArea: function(){
					var $text = $('<input type="text" readonly></input>');
					$text.addClass($.sbtools.CONSTANTS.UICLASS.TEXT_COMMON);
					if ($sbpersonselect.settings.id) {
						$text.attr("id", $sbpersonselect.settings.id);
					}
					if ($sbpersonselect.settings.name) {
						$text.attr("name", $sbpersonselect.settings.name);
					}
					if ($sbpersonselect.settings.style) {
						$text.attr("style", $sbpersonselect.settings.style);
					}
					
					$text.attr("disabled", $sbpersonselect.settings.disabled);
					$.sbtools.toggleInputDisabledClass($text, $sbpersonselect.settings.disabled);
					
					$.sbtools.toggleInputReadonlyClass($text, $sbpersonselect.settings.readonly);

					$sbpersonselect.append($text);
					$sbpersonselect._$labelControl = $text;
				},
				
				/**
				 * 渲染选中区域
				 */
				_renderSelectContainerArea: function(){
					var $container = $('<div class="sinobest-perselect-group-container sinob-widget-container"></div>');
					
					var $groupBtns = $('<div class="sinobest-perselect-group-btns"></div>');
					var $confirmBtn =  $('<input type="button" value="确认" class="sinobest-button-common sinobest-perselect-group-btns-confirmbtn"></input>');  
					var $clearBtn = $('<input type="button" value="清除"    class="sinobest-button-common sinobest-perselect-group-btns-clearbtn"></input>');
					$groupBtns.append($confirmBtn).append($clearBtn);
			        
					var $groupSelect= $('<div class="sinobest-perselect-group-select-container"></div>');
					$container.append($groupSelect).append($groupBtns);
					
					//$sbpersonselect.append($container);
					if($sbpersonselect.attr("id")){
						$container.attr("id", $sbpersonselect.attr("id") + "_personselect_group_container");
					}else{
						if($sbpersonselect.settings.id){
							$container.attr("id", $sbpersonselect.settings.id + "_personselect_group_container");
						}
					}
					$(document.body).append($container);
					
					$sbpersonselect._$container = $container;
					$sbpersonselect._$clearBtnControl = $clearBtn;
					$sbpersonselect._$confirmBtnControl = $confirmBtn;
					$sbpersonselect._$groupSelectControl = $groupSelect;
					
				},
				
				/**
				 * 构建人员选择控件
				 */
				_buildPersonSelect: function(){
					$sbpersonselect._$container.isFillDynamicDatas = false;
					this._buildLabel();
					this._buildBtns();
					this._buildSelect();
					
					this._fillDatas();
				},
				
				/**
				 * 构建标签
				 */
				_buildLabel: function(){
					var _this = this;
					$sbpersonselect._$labelControl.bind("click", function() {
						//容器可见,则不在弹出
						if($sbpersonselect._$container.is(":visible")){
							return;
						}
						
						if ($sbpersonselect.settings.readonly) {
							return;
						}
						
						if (!$sbpersonselect._$container.isFillDynamicDatas) {
							_this._fillDynamicDatas(_this._adjustContainerLeft);
							$sbpersonselect._$container.isFillDynamicDatas = true;
						}else{
							_this._adjustContainerLeft();
						}
						
						$("html").bind("mousedown", sinobestPersonselect2OnBodyDown);
					});

					$sbpersonselect._$labelControl.setValue = function(items) {
						if (items !== undefined && items.length > 0) {
							var labelValue = "";
							if ($sbpersonselect.settings.type == 'single') {
								labelValue += items[0][$sbpersonselect.settings.labelField];
							} else {
								for (var i = 0, length = items.length; i < length; i++) {
									labelValue += items[i][$sbpersonselect.settings.labelField];
									if (i != items.length - 1) {
										labelValue += ";";
									}
								}
							}
							this.val(labelValue);
							this.attr("title", labelValue);
						} else {
							this.val("");
							this.attr("title", "");
						}
					};
				
				},
				
				/**
				 * 当标签控件太靠窗口右边的时候，需要调整容器的left距离
				 */
				_adjustContainerLeft: function(){
					  $.sbtools.adjustInputPopupDropdownContainerPosition($sbpersonselect._$labelControl, $sbpersonselect._$container);
				},
				
				/**
				 * 构建按钮
				 */
				_buildBtns: function(){
					$sbpersonselect._$confirmBtnControl.bind("click", function() {
						var items = $sbpersonselect._$groupSelectControl.getSelectItems();
						if (invokeCallback("onConfirm", [items])) {
							var oldValue = $sbpersonselect.getValue();
							
							$sbpersonselect._$labelControl.setValue(items);
							$sbpersonselect._$groupSelectControl.setValue(items);
							hideContainer();
							
							//确定后才会触发onchange
							var isChange = (oldValue.toString() !=  $sbpersonselect.getValue().toString());
							if(isChange){
								var selectItems = $sbpersonselect._$groupSelectControl.getValue();
					        	invokeCallback("onChange", [selectItems, "add", selectItems]);
							}
						}
					});

					$sbpersonselect._$clearBtnControl.bind("click", function() {
						var oldValue = $sbpersonselect.getValue();
						//清空
						$sbpersonselect._$groupSelectControl.clearSelectedItems();
						
						//设值
						var items = $sbpersonselect._$groupSelectControl.getSelectItems();
						$sbpersonselect._$labelControl.setValue(items);
						$sbpersonselect._$groupSelectControl.setValue(items);
						
						//确定后才会触发onchange
						var isChange = (oldValue.toString() !=  $sbpersonselect.getValue().toString());
						if(isChange){
							var selectItems = $sbpersonselect._$groupSelectControl.getValue();
				        	invokeCallback("onChange", [selectItems, "remove", selectItems]);
						}
					});
				},
				
				/**
				 * 构建选择区域
				 */
				_buildSelect: function(){
					/**
					 * 初始化方法
					 */
					$sbpersonselect._$groupSelectControl.init = function(dataResponse){
						this.empty();
						this.addGroup(dataResponse.data);
						//根据控件的值设置需要选中的明细项
						this.setItemsSelected(this.getValue());
					};
					
					/**
					 * 增加组
					 */
                    $sbpersonselect._$groupSelectControl.addGroup = function(groups){
						if(groups === undefined){
							return;
						}
						
						for(var i = 0, length = groups.length; i < length; i++){
							//超过最大显示组,则不渲染
							if(i >= $sbpersonselect.settings.maxShowGroupSize){
								break;
							}
							
							var group = groups[i];
							var $group = $('<div class="sinobest-perselect-group"></div>');
							if((i == length - 1) || (i == $sbpersonselect.settings.maxShowGroupSize - 1)){
								$group.addClass("sinobest-perselect-group-last");
							}
							var $groupHeader = $('<div class="sinobest-perselect-group-header"></div>');
							$groupHeader.attr("title", group.groupName);
							$groupHeader.text(group.groupName);
							
							var $groupItemContainer = $('<div class="sinobest-perselect-group-item-container"></div>');
							$group.append($groupHeader).append($groupItemContainer);
							
							this.bindHeaderEvent($groupHeader);
							for(var itemI = 0, itemLength = group.data.length; itemI < itemLength; itemI++){
								var item = group.data[itemI];
								var $item = $('<div class="sinobest-perselect-group-item"></div>');
								$item.attr("data-key",   item[$sbpersonselect.settings.valueField]);
								$item.attr("data-value", item[$sbpersonselect.settings.labelField]);
								$item.text(item[$sbpersonselect.settings.labelField]);
								
								$item.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, item);
								this.bindItemEvent($item);
								$groupItemContainer.append($item);
							}
							
							this.append($group);
						}
						
					};
					
					/**
					 * 绑定组头部事件
					 */
					$sbpersonselect._$groupSelectControl.bindHeaderEvent = function($groupHeader){
						var _this = this;
						$groupHeader.on("dblclick", function(){
							   var $findItems = $(this).closest(".sinobest-perselect-group")
							                           .find(".sinobest-perselect-group-item-container")
						                               .find(".sinobest-perselect-group-item");
							   if($(this).data("selected-header")){
								   $(this).removeData("selected-header");
								   
								   $findItems.each(function(index, element){
							            _this.toggleItemSelectedClass($(this), false);
							       });
								   //invokeCallback("onChange", [getItems($findItems), "remove", _this.getSelectItems()]);
							   }else{
								   $(this).data("selected-header", true);
								 
								   if(_this.canSelectMultipleItems($findItems.length)){
									   $findItems.each(function(index, element){
								              _this.toggleItemSelectedClass($(this), true);
								       });
									   //invokeCallback("onChange", [getItems($findItems), "add", _this.getSelectItems()]);
								   }
							   }
							   
						 });
					};
					
					/**
					 * 绑定明细项目事件
					 */
					$sbpersonselect._$groupSelectControl.bindItemEvent = function($item){
						 var _this = this;
						 $item.on("click", function(){
							  if($(this).hasClass('sinobest-perselect-group-item-selected')){
								  _this.toggleItemSelectedClass($(this), false);
								  //invokeCallback("onChange", [getItems($(this)), "remove", _this.getSelectItems()]);
								  return;
							  }
							  
							  if(_this.canSelectMultipleItems(1)){
								  _this.toggleItemSelectedClass($(this), true);
								  //invokeCallback("onChange", [getItems($(this)), "add", _this.getSelectItems()]);
							  }
						 }).hover(function () {
					         $(this).addClass("sinobest-perselect-group-item-hover");
					       },function () { 
					         $(this).removeClass("sinobest-perselect-group-item-hover");
					       }
					     ); 
					};
					
					/**
					 * 获取选择的项目
					 */
					$sbpersonselect._$groupSelectControl.getSelectItems = function(){
						return getItems(this.find("div.sinobest-perselect-group-item-selected"));
					};
					
					/**
					 * 清空选择的项目
					 */
					$sbpersonselect._$groupSelectControl.clearSelectedItems = function(){
						var _this = this;
						this.find("div.sinobest-perselect-group-item-selected").each(function(index, element){
							 _this.toggleItemSelectedClass($(element), false);
						});
					};
					
					/**
					 * 设置项目被选择
					 */
					$sbpersonselect._$groupSelectControl.setItemsSelected = function(items){
						if(items === undefined){
							return;
						}
						
						for(var i = 0, length = items.length; i < length; i++){
							   var item = items[i];
							   var $item = this.find('.sinobest-perselect-group-item[data-key="'+item[$sbpersonselect.settings.valueField]+'"]');
							   this.toggleItemSelectedClass($item, true);
						}
					};
					
					/**
					 * 设置值
					 */
					$sbpersonselect._$groupSelectControl.setValue = function(items){
		         		 if(items === undefined){
		         			this.value = [];
		         		 }else{
		         			if($sbpersonselect.settings.type == 'single'){
		             			if(items.length > 0){
		             				this.value = items.slice(0,1);
		             			}
		             		}else{
		             			this.value = items;
		             		}
		         		 }
		         	};
		         	
		         	/**
		         	 * 获取值
		         	 */
		         	$sbpersonselect._$groupSelectControl.getValue = function(){
		         		if(typeof this.value == 'undefined'){
		         			return [];
		         		}
		         		return this.value;
		         	};
					
		         	/**
		         	 * 能否多选
		         	 */
		         	$sbpersonselect._$groupSelectControl.canSelectMultipleItems = function(selectItemsLength){
			    		if($sbpersonselect.settings.type == 'single'){
			       			if(this.getSelectItems().length >= 1
			       					|| selectItemsLength > 1){
			       				alert("最多只能选择一条记录");
			       				return false;
			       			}
			       		}
			           	return true;
			        };
			        
			        /**
			         * 切换item的选中和非选中
			         * 
			         * @param $item 当前项的jquery对象
			         * @param flag  true:表示增加选中  false:表示移除选中
			         */
			        $sbpersonselect._$groupSelectControl.toggleItemSelectedClass = function($item, flag){
				    	if(flag){
				    		$item.addClass("sinobest-perselect-group-item-selected");
				    	}else{
				    		$item.removeClass("sinobest-perselect-group-item-selected");
				    	}
				    };
				    
				    function getItems($items){
				    	var items = [];
				    	$.each($items, function(index, element){
				    		var item = {};
							item[$sbpersonselect.settings.valueField] = $(element).attr("data-key");
							item[$sbpersonselect.settings.labelField] = $(element).attr("data-value");
							
							var dataItem = $(element).data($.sbtools.CONSTANTS.DATA_SBITEM_KEY);
							if(dataItem !== undefined && dataItem !== null){
								for(var itemKey in dataItem){
									if(item.hasOwnProperty(itemKey)){
				        				continue;
				        			}
									item[itemKey] = dataItem[itemKey];
								}
							}
							
							items.push(item);
				    	});
						return items;
				    };
				},
				
			
				/**
				 * 填充数据
				 */
				_fillDatas: function() {
					if($sbpersonselect.settings.value !== undefined && $sbpersonselect.settings.value !== null){
						doSetValue($sbpersonselect.settings.value, function(){
							 initComplete();
							 triggerChangeWhenSetValue();
			    		});
					}else{
						 initComplete();
					}
					if($sbpersonselect._$container.isFillDynamicDatas) {
						this._fillDynamicDatas();
					}
				},

				/**
				 * 填充动态数据
				 */
				_fillDynamicDatas: function(callBack) {
					var request = {};
					$.extend(request, $sbpersonselect.settings.otherRequestParam|| {});
					
					if($sbpersonselect.settings.onAjaxRequest && $.isFunction($sbpersonselect.settings.onAjaxRequest)){
					   request = ($sbpersonselect.settings.onAjaxRequest)(request);
		            }
					$.ajax({
								type : "post",
								contentType : "application/json; charset=utf-8",
								dataType : "json",
								data : JSON.stringify(request),
								url : $sbpersonselect.settings.url,
								success : function(dataResponse) {
									if($sbpersonselect.settings.onAjaxResponse 
											   && $.isFunction($sbpersonselect.settings.onAjaxResponse)){
				  						  ($sbpersonselect.settings.onAjaxResponse)(dataResponse);
				  					}
									$sbpersonselect._$groupSelectControl.init(dataResponse);
									if(callBack !== undefined && typeof callBack === 'function'){
										setTimeout(function(){
											callBack();
										}, 0);
									}
								},
								error : function(XMLHttpRequest, textStatus, errorThrown) {
									var e = {};
									e.code = XMLHttpRequest.status;
									e.msg = $.sberror.format(e.code, this.url);
									$.sberror.onError(e);
								}
					});
				
				}
				
				
		};
		
		/**
		 * Main function
		 */
		return this.each(function() {
			render();
		});

	};

})(jQuery);/**
 * Sinobest-Popuplayer:弹出层组件
 * 
 * Dependency:sinobest.tools.js
 */
(function ($) {
	
	$.extend({sbpopuplayer:{}});
	
    $.extend($.sbpopuplayer, {
    	
    	/**
    	 * 注册弹出层容器
    	 */
    	registerPopup:function($div_obj){
    		$div_obj.addClass("sinobest-popuplayer-box");
    	},
    	
    	/**
    	 * 弹出层
    	 */
    	popup:function ($div_obj) {
    		//document.body.style.overflow="hidden";
            // 计算机屏幕高度  
            var windowWidth = $(document).width(); 
            // 取得传入DIV的长度  
            var popupWidth = $div_obj.width(); 
            
            //添加并显示遮罩层  
            var $mask = $("<div class='sinobest-popuplayer-mask'></div>");
            $mask.appendTo("body").fadeIn(200);
            
            var _this = this;
            //考虑外部包装的父元素设置position=relative的情况
            var $relativeParent = $("<test></test>");
            $div_obj.parents().each(function(){
	    	     if($(this).css("position") == "relative"){
	    	    	 $relativeParent = $(this);
	    	    	 return false;
	    	     }
	    	});
            
            _this._ie67PositionForZindexCompatibilityOnShow($div_obj);
            _this._ie6MarkSelectOnShow();
            
            var divObjTop = ($div_obj.offset().top - $relativeParent.offset().top);
            divObjTop = (divObjTop < 0 ? 0 : divObjTop);
            // 显示弹出的DIV
            $div_obj.css({ 
                 "position" : "absloute",
                 left : windowWidth / 2 - popupWidth / 2,
                 top: divObjTop + 50
            }).animate({
                 opacity : "show"
            }, "slow", function(){
            	_this._setMaskLayerSize($mask);
            });
            
            //将焦点至于弹出的容器中
            $div_obj.focus();
        },
        
        /**
         * IE6,IE7中的z-index会根据父元素(position设置值)为准
         */
        _ie67PositionForZindexCompatibilityOnShow:function($div_obj){
        	if(!($.sbtools.isIE6OrIE7())){
        		return;
        	}
            
        	var $topRelativeParent = $("<test></test>");
            $div_obj.parents().each(function(){
            	 var parentPostion = $(this).css("position");
	    	     if(parentPostion == "relative" || parentPostion == "absolute" ||
	    	    		 ($.sbtools.isIE7() && parentPostion == "fixed")){
	    	    	 $topRelativeParent = $(this);
	    	     }
	    	});
            
        	if($topRelativeParent.get(0).tagName == "test"){
        		return;
        	}
            		 
            var topZindex = $topRelativeParent.css("z-index");
            if(Number(topZindex) < Number($div_obj.css("z-index"))){
            	 $topRelativeParent.data("originalZindex", topZindex);
            	 $topRelativeParent.css("z-index", $div_obj.css("z-index"));
            	 $div_obj.data("topRelativeParent", $topRelativeParent);
            }
        },
        
        
        /**
         * 隐藏弹出
         */
        hide: function($div_obj) {
            $(".sinobest-popuplayer-mask").remove(); 
            
            this._ie67PositionForZindexCompatibilityOnHide($div_obj);
            
            this._ie6MarkSelectOnHide();
            
            $div_obj.animate({
                left : 0, 
                top : 0, 
                opacity : "hide" 
            }, "slow"); 
        },
        
        _ie67PositionForZindexCompatibilityOnHide:function($div_obj){
        	if(!($.sbtools.isIE6OrIE7())){
        		return;
        	}
        	var $topRelativeParent = $div_obj.data("topRelativeParent");
            if($topRelativeParent){
            	 $topRelativeParent.css("z-index", $topRelativeParent.data("originalZindex"));
            	 $topRelativeParent.removeData("originalZindex");
            }
        },
        
        _ie6MarkSelectOnShow:function(){
        	if($.sbtools.isIE6()){
  	          //IE6下面select无法遮罩的问题
  	      	  $("select:visible").attr("mark-select-hide", "true").hide();
        	}
        },
        
        _ie6MarkSelectOnHide:function(){
        	if($.sbtools.isIE6()){
        		$("select[mark-select-hide=true]").removeAttr("mark-select-hide").show();
        	}
        },
        
        /**
         * 设置遮罩层的高度和宽度.IE6需要设置，其他浏览器正常
         */
        _setMaskLayerSize :function($mask){
        		if($.sbtools.isIE6()){
        			  var b = document.documentElement.clientHeight ? document.documentElement : document.body;
        	          var height = b.scrollHeight > b.clientHeight ? b.scrollHeight : b.clientHeight;
        	          var width = b.scrollWidth > b.clientWidth ? b.scrollWidth : b.clientWidth;
        	          $mask.css({height: height, width: width});
        		}
        }
        
    });
    
})(jQuery);/**
 * Sinobeset-Radio:单选按钮组件
 * 
 * Dependency:sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-radio",
        required: false,
        disabled: false,
        readonly: false,
        name: null,
        direction: 'line', //row、table
        columnCount: null,
        data: null,
        url: null,
        valueField: "code",
        labelField: "detail",
        callback: null,
        value: null,
        onAjaxRequest: null, 
	    onAjaxResponse: null,
	    saveType:"c",
	    onChange:null,
	    mode:"btntext",   //btntext：按钮文本模式   text:文本模式
	    onInitComplete:null,
	    setValueTriggerChange:true
    };

    var UICLASS = {
    	TEXT_SELECTED : "sinobest-radio-text-selected",  //正常模式已选文本
    	TEXT_LABEL    : "sinobest-radio-text-label",     //正常模式文本
    	TEXT_DISABLED : "sinobest-radio-text-disabled",  //disabled模式的不可用文本
    	TEXT_READONLY : "sinobest-radio-text-readonly",  //readonly模式的只读文本
    	TEXT_DISABLED_SELECTED : "sinobest-radio-text-disabled-selected", //disabled模式下的已选文本
    	TEXT_READONLY_SELECTED : "sinobest-radio-text-readonly-selected", //readonly模式下的已选文本
    	TEXT_LINE_CONTENT:"sinobest-radio-text-line-content", //文本模式line布局下内容区域的样式
    	LINE_CONTENT:"sinobest-radio-line-content"       //line布局下内容区域的样式
    };
    
    $.fn.sbradio = function (options) {
        var $radio = this;
        var settings;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }

        $radio.settings = settings;

        function getter() {
            return $radio.data("$radio");
        }

        function setter() {
            $radio.data("$radio", $radio);
        }

        function isContain() {
            return $radio.data("$radio");
        }

        $.sbbase.mixinWidget($radio);
        
        /**
         * Get Value
         * @return {*}
         */
        $radio.getValue = function () {
        	var $allRadios =  $radio.find(":radio");
        	if($radio.settings.saveType == "c"){
        		return  $allRadios.filter(':checked').val() || "";
        	}else{
        		var $checkedRadio = $allRadios.filter(':checked');
        		if($checkedRadio.length > 0){
        			return $checkedRadio.next("label").text();
        		}else{
        			return "";
        		}
        	}
        };
        
        $radio.getLabel = function () {
            return $radio.find(":radio").filter(':checked').next("label").text();
        };

        /**
         * Set Radio Value
         * @param v
         * @return {*}
         */
        $radio.setValue = function (v) {
            return doSetValue(v, function(){
            	triggerChangeWhenSetValue();
            });
        };
        
        function doSetValue(v, completeCallBack){
            if (!$radio.settings.data) {
                $radio.data('$temp', v);
                return $radio;
            }

            var $allRadios = $radio.find(":radio");
            if(isTextMode()){
            	//表示选择的class都需要删除
            	$allRadios.filter(':checked').next().removeClass(UICLASS.TEXT_SELECTED);
            	$allRadios.filter(':checked').next().removeClass(UICLASS.TEXT_DISABLED_SELECTED);
            	$allRadios.filter(':checked').next().removeClass(UICLASS.TEXT_READONLY_SELECTED);
            }
            $allRadios.filter(':checked').prop('checked', false);
            
            if (v && $.trim(v)) {
            	if($radio.settings.saveType == "c"){
            		$allRadios.filter('[value=' + v + ']').prop('checked', true);
            	}else{
            		$radio.find("label").each(function(index, element){
            			if($(element).text() == v){
            				$(element).prev("input[type='radio']").prop('checked', true);
            				return false;
            			}
            		});
            	}
            }
            
            if(isTextMode()){
            	disabledCheckedTextMode($radio.settings.disabled);
            	readonlyCheckedTextMode($radio.settings.readonly);
            }
            
            $radio.settings.value = v;
            
            if(completeCallBack){
            	completeCallBack();
            }
        };

        function triggerChangeWhenSetValue(){
        	 if($.isFunction($radio.settings.onChange) && $radio.settings.setValueTriggerChange){
            	 var selectItems = $radio.getSelectItems();
            	 var changeItem = null;
            	 if(selectItems.length > 0){
            		 changeItem = selectItems[0];
            	 }else{
            		 changeItem = {}; 
            		 changeItem[$radio.settings.valueField] = "";
            		 changeItem[$radio.settings.labelField] = "";
            	 }
            	 triggerChange(changeItem, "add");
            }
        }
        
        /**
         * 是否文本模式,文本模式不包含单选按钮
         */
        function isTextMode(){
        	if($radio.settings.mode == "text"){
        		return true;
        	}
        	return false;
        }
        
        $radio.getName = function () {
            return $radio.settings.name;
        };

        /**
         * Set new state
         * @param stateJson
         * @return {*}
         */
        $radio.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null) {
                    if (k == 'value') {
                        $radio.setValue(v);
                    } else {
                        if (k == 'required') {
                            $radio.settings.required = v;
                            $radio.attr(k, v);
                        }else if(k == "readonly"){
                            $radio.settings.readonly = v;
                            readonly(v);
                        }else if (k == 'disabled') {
                            $radio.settings.disabled = v;
                            disabled(v);
                        } else{
                        	$radio.attr(k, v);
                        }
                    }
                } else {
                    $radio.removeAttr(k);
                }
            });
            return $radio;
        };
		
        $radio.getDefaultOptions = function(){
        	return defaults;
        };
        
        /**
         * 不可用处理
         */
        function disabled(flag){
           var $allRadios = $radio.find("input:radio");
           $allRadios.attr("disabled", flag);
           
           if(isTextMode()){
       		 if(flag){
       			$allRadios.next().addClass(UICLASS.TEXT_DISABLED);
       		 }else{
       			$allRadios.next().removeClass(UICLASS.TEXT_DISABLED);
       		 }
       		 disabledCheckedTextMode(flag);
       	   }
        }
        
        /**
         * 不可用已选的处理
         */
        function disabledCheckedTextMode(flag){
        	if(!isTextMode()){
        		return;
        	}
        	
        	var $allRadios = $radio.find(":radio");
        	if(flag){
        		$allRadios.filter(':checked').next().removeClass(UICLASS.TEXT_SELECTED);
        		$allRadios.filter(':checked').next().addClass(UICLASS.TEXT_DISABLED_SELECTED);
        	}else{
        		$allRadios.filter(':checked').next().addClass(UICLASS.TEXT_SELECTED);
        		$allRadios.filter(':checked').next().removeClass(UICLASS.TEXT_DISABLED_SELECTED);
        	}
        }
        
        /**
         * 只读的处理
         * disabled的优先级高于readonly
         */
        function readonly(flag){
        	if($radio.settings.disabled){
        		return;  
        	}
        	
        	//readonly用disabled模拟
        	var $allRadios = $radio.find("input:radio");
        	$allRadios.attr("disabled", flag);
        	
        	if(isTextMode()){
        		if(flag){
        			$allRadios.next().addClass(UICLASS.TEXT_READONLY);
        		}else{
        			$allRadios.next().removeClass(UICLASS.TEXT_READONLY);
        		}
        		readonlyCheckedTextMode(flag);
        	}
        }
        
        /**
         * 只读已选的处理
         */
        function readonlyCheckedTextMode(flag){
        	if(!isTextMode()){
        		return;
        	}
        	if($radio.settings.disabled){
        		return;
        	}
        	
        	var $allRadios = $radio.find(":radio");
        	if(flag){
        		$allRadios.filter(':checked').next().removeClass(UICLASS.TEXT_SELECTED);
        		$allRadios.filter(':checked').next().addClass(UICLASS.TEXT_READONLY_SELECTED);
        	}else{
        	    $allRadios.filter(':checked').next().addClass(UICLASS.TEXT_SELECTED);
        	    $allRadios.filter(':checked').next().removeClass(UICLASS.TEXT_READONLY_SELECTED);
        	}
        }
        
        $radio.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($radio, "$sbradio");
            render();
        };
        
        $radio.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		$radio.settings.data= null;
        		$radio.settings.url = null;
        		
       		    if($.isArray(dataSource)){
       		    	$radio.settings.data = dataSource;
       		    }else{
       		    	$radio.settings.url = dataSource;
       		    }
       		    $radio.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };

        /**
         * 验证函数
         * @return {*}
         */
        $radio.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                var v = $radio.getValue();
                var isOk = false;

                if (settings.required) {
                    isOk = $.sbvalidator.required($radio[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };

        $radio.getSelectItems = function(){
             var selectItems = [];
             
             var $checkedRadio =  $radio.find(":radio").filter(':checked');
             if($checkedRadio.length > 0){
            	 selectItems.push($checkedRadio.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY));
      		 } 
             return selectItems;
        };
        
        /**
         * Id生成策略
         */
        function generateId(idx) {
            return $radio.settings.name + "_" + idx;
        }

        /**
         * Always build from data
         */
        function buildRadio(data) {
            $.each(data, function (idx, obj) {
                var id = generateId(idx);
                var radio = $('<input type="radio"/>');
				radio.attr("name",$radio.settings.name);
				radio.attr("id",id);
                var label = $('<label></label>');
				label.attr("for",id);
                $.each(obj, function (k, v) {
                    var isAttr = true;
                    if (k == $radio.settings.valueField) {
                        radio.val(v);
                        isAttr = false;
                    }
                    if (k == $radio.settings.labelField) {
                        label.text(v);
                        isAttr = false;
                    }
                    if (isAttr) {
                    	//IE7以下当设置status时会默认设置为选中
                    	if($.sbtools.isIE6OrIE7()){
                    		if(k != "status"){
                    			radio.attr(k, v);
                    		}
                    	}else{
                    		radio.attr(k, v);
                    	}
                    }
                });
                radio.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, obj);
                var $container = $("<div></div>");
                $container.append(radio).append(label);
                $radio.append($container);
            });

            disabled($radio.settings.disabled);
            readonly($radio.settings.readonly);
            
            if(isTextMode()){
            	var $allRadios = $radio.find("input:radio");
            	$allRadios.next().addClass(UICLASS.TEXT_LABEL);
            	$allRadios.hide();
            }
            
            addEventListener();
        }

        /**
         * Init value or event
         */
        function addEventListener() {
            // 排列问题
            if (settings.direction == 'table') {
                tableRadio();
            } else if (settings.direction == 'row') {
                verticalRadio();
            } else {
                horizontalRadio();
            }
            
            addTableLayoutAttributes();
            bindEvent();
            
            if($radio.data('$temp')) {
      		   $radio.settings.value = $radio.data('$temp');
      		   $radio.removeData('$temp');
            }
      	  
            // 初始值问题
            if($radio.settings.value !== undefined && $radio.settings.value !== null) {
          	   doSetValue($radio.settings.value, function(){
          		    initComplete();
          		    triggerChangeWhenSetValue();
          	   });
            }else{
            	initComplete();
            }
        }
        
        /**
         * 增加table布局的属性
         */
        function addTableLayoutAttributes(){
        	if(isTextMode()){
        		var $tableLayout = $radio.find("table");
        		$tableLayout.attr("cellpadding", 0);
        		$tableLayout.attr("cellspacing", 0);
        		$tableLayout.attr("border", 0);
        	}
        }
        
        function bindEvent(){
        	var $allRadios = $radio.find("input:radio");
        	if(isTextMode()){
        		$allRadios.next().bind("click", function(){
        			 if($radio.settings.readonly || $radio.settings.disabled){
        				 return;
        			 }
        			 
        			 var $radioBtn = $(this).prev();
        			 if($(this).hasClass(UICLASS.TEXT_SELECTED)){
        				 $(this).removeClass(UICLASS.TEXT_SELECTED);
        				 $radioBtn.prop('checked', false);
        			 }else{
        				 $allRadios.next().removeClass(UICLASS.TEXT_SELECTED);
        				 $allRadios.attr('checked', false);
        				 $(this).addClass(UICLASS.TEXT_SELECTED);
        				 $radioBtn.prop('checked', true);
        			 }
        			 
        			 if($radio.settings.onChange){
        				 var currentValue = {};
                    	 currentValue[$radio.settings.valueField] = $(this).prev().attr("value");
                    	 currentValue[$radio.settings.labelField] = $(this).text();
                    	 if($radioBtn.is(':checked')){
                    		 triggerChange(currentValue, "add");
                    	 }else{
                    		 triggerChange(currentValue, "remove");
                    	 }
    				 }
        			 
        			 return false;
        		});
        		
        		$.sbtools.registerBaseEvent($allRadios.next(), $radio.settings, function(){
        			 if($radio.settings.readonly || $radio.settings.disabled){
        				 return false;
        			 }
        			 return true;
        		});
        	}else{
        		if($radio.settings.onChange){
            		$allRadios.bind("change", function(){
                    	 var currentValue = {};
                    	 currentValue[$radio.settings.valueField] = $(this).attr("value");
                    	 currentValue[$radio.settings.labelField] = $(this).next("label").text();
                    	 triggerChange(currentValue, "add");
                    });
                }
            	
            	//双击选中的取消
            	$allRadios.bind("dblclick", function(){
            		if($(this).get(0).checked){ 
            		    $(this).attr('checked', false);
            		    
            		    if($radio.settings.onChange){
            		    	 var currentValue = {};
                          	 currentValue[$radio.settings.valueField] = $(this).attr("value");
                          	 currentValue[$radio.settings.labelField] = $(this).next("label").text();
                          	 triggerChange(currentValue, "remove");
            		    }
            		}
            	});
            	
            	$.sbtools.registerBaseEvent($allRadios, $radio.settings);
        	}
        }

        function triggerChange(currentValue, oper){
        	if($radio.settings.onChange){
        		$radio.settings.onChange.apply($radio, [currentValue, oper]);        		
        	}
        }
        
        /**
         * Clear radio
         */
        function clearRadio() {
            $radio.html("");
        }

        function initComplete(){
            $.sbtools.initController.initComplete($radio, "$sbradio", function(){
                if(!isContain()){
                    setter();
                }
            }, $radio.settings.onInitComplete);
        }
        
        /**
         * 渲染控件,支持本地数据和远程数据
         */
        function render() {
            $radio.addClass(settings.className);
            $radio.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            $radio.attr('required', settings.required);
            
            if ($radio.settings.url) {
            	var queryRequest = {};
            	if($radio.settings.onAjaxRequest && $.isFunction($radio.settings.onAjaxRequest)){
				   queryRequest = ($radio.settings.onAjaxRequest)(queryRequest);
		        }
            	
                // 异步-Remote url
                $.ajax({
                    type: "post",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data:JSON.stringify(queryRequest),
                    url: $radio.settings.url,
                    success: function (data) {
                    	if($radio.settings.onAjaxResponse && $.isFunction($radio.settings.onAjaxResponse)){
  						   ($radio.settings.onAjaxResponse)(data);
  					    }
                        $radio.settings.data = data;
                        clearRadio();
                        buildRadio($radio.settings.data);
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        var e = {};
                        e.code = XMLHttpRequest.status;
                        e.msg = $.sberror.format(e.code, this.url);
                        // 根据规范要求将错误交给全局函数处理
                        $.sberror.onError(e);
                    }
                });
            } else {
            	if(!$radio.settings.data){
            		$radio.settings.data = [];
            	}
                // 同步-Local data
                clearRadio();
                buildRadio($radio.settings.data);
            }
            setter();
        }

        /**
         * 按每行显示几列这样的表格排列
         */
        function tableRadio() {
            var $div = $radio.find(":radio").parent("div");
            if ($div.parent("td").length > 0) {
                return;
            }
            $div.wrapAll("<table><tbody></tbody></table>");
            var last = null;
            $div.each(function (idx) {
                if (idx % settings.columnCount === 0) {
                    last = $(this).wrap("<tr><td></td></tr>");
                } else {
                    last = $(this).insertAfter(last.parent("td")).wrap("<td></td>");
                }
            });
        }

        /**
         * 按行排列
         */
        function verticalRadio() {
            var $div = $radio.find(":radio").parent("div");
            // 排序基本结构在reload的时候不需要重构
            if ($div.parent("td").length > 0) {
                return;
            }
            $div.wrapAll("<table><tbody></tbody></table>").wrap("<tr><td></td></tr>");
        }

        /**
         * 排成一行显示
         */
        function horizontalRadio() {
            var $div = $radio.find(":radio").parent("div");
            if ($div.parent("td").length > 0) {
                return;
            }
            //$div.wrapAll("<table><tbody><tr></tr></tbody></table>").wrap("<td></td>");
            if(isTextMode()){
            	$div.addClass(UICLASS.TEXT_LINE_CONTENT);
            }else{
            	$div.addClass(UICLASS.LINE_CONTENT);
            }
            $div.wrapAll("<table><tbody><tr><td></td></tr></tbody></table>");
        }

        render();
        return this;
    };
})(jQuery);
/**
 * Sinobest-Richtexteditor:富文本组件
 * 
 * Dependency:kindeditor.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
        id:null,          
        name:null,        
        height:"300px",   
        width:"100%",    
        value:null,       
        mode:"simple",     //simple,full
        toolBarItems:null, 
        uploadUrl:"",    
        className:"sinobest-richtexteditor",
        required:false,
        disabled:false,
        readonly:false,
        callback:null,
        setting:null,
        resizeType:"no",  //all  height  no
        onInitComplete:null
    };

  /*  
   * kindeditor在32位IE8下面 动态加载css报错 【后测试没有发现此问题,先注释,若存在问题即恢复代码】
   * function autoLoadKindEditorStyles(){
    	if (KindEditor.options.loadStyleMode) {
    	    var themesPath = KindEditor.basePath + 'themes/';
    		var themeType =  KindEditor.options.themeType;
    		KindEditor.loadStyle(themesPath + 'default/default.css');
    		KindEditor.loadStyle(themesPath + themeType + '/' + themeType + '.css');
    	}
    }
    autoLoadKindEditorStyles();*/
    
    $.fn.sbrichtexteditor = function(options) {
        var $richtexteditor = this;
        var settings;
        if(isContain()){
            if(options){
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            }else{
                return getter();
            }
        }else{
            settings = $.extend({}, defaults, options || {});
        }

        $richtexteditor.settings = settings;

        function getter(){
           return $richtexteditor.data("$richtexteditor");
        }
        
        function setter(){
        	$richtexteditor.data("$richtexteditor", $richtexteditor);
        }
        
        function isContain(){
            return $richtexteditor.data("$richtexteditor");
        }

        $.sbbase.mixinWidget($richtexteditor);
        
        $richtexteditor.getValue = function () {
        	if($richtexteditor._editor.isEmpty()){
        		return "";
        	}
            return $richtexteditor._editor.html();
        };

        $richtexteditor.setValue = function (value) {
        	if(!$richtexteditor.isCreatedEditor){
        		$richtexteditor.data("$tempSetValue", value);
        		return $richtexteditor;
        	}
            $richtexteditor._editor.html(value);
            $richtexteditor.settings.value = value;
            return $richtexteditor;
        };

        $richtexteditor.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
                if (v !== undefined && v !== null) {
                    if (k == 'value') {
                    	$richtexteditor.setValue(v);
                    } else {
                        if (k == 'required') {
                        	$richtexteditor.settings.required = v;
                        } else if (k == 'readonly') {
                        	$richtexteditor.settings.readonly = v;
                        	if($richtexteditor.isCreatedEditor){
                        		$richtexteditor._editor.readonly(v);
                        		toggleReadonlyClass(v);
                        	}else{
                        		$richtexteditor.data("$tempReadonly", v);
                        	}
                        } else if(k == 'disabled'){
                        	$richtexteditor.settings.disabled = v;
                        	if($richtexteditor.isCreatedEditor){
                        		$richtexteditor._editor.readonly(v);
                        	}else{
                        		$richtexteditor.data("$tempDisabled", v);
                        	}
                        }
                        $richtexteditor.attr(k, v);
                    }
                } else {
                	$richtexteditor.removeAttr(k);
                }
            });
            return $richtexteditor;
        };
		
        $richtexteditor.getDefaultOptions = function(){
        	return defaults;
        };

        $richtexteditor.reload = function () {
        	$richtexteditor.empty();
        	$richtexteditor.isCreatedEditor = false;
        	$richtexteditor._editor.remove();
        	$.sbtools.initController.removeInitCompleteFlag($richtexteditor, "$sbrichtexteditor");
            return render();
        };
        
        $richtexteditor.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                if (settings.required) {
                    if($richtexteditor._editor.isEmpty()){
                    	$richtexteditor._$textarea.val("");
                    }else{
                    	$richtexteditor._editor.sync();
                    }
                	var isOk = false;
                    isOk = $.sbvalidator.required($richtexteditor._$textarea[0], $richtexteditor.getValue());
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };

        $richtexteditor.getName = function(){
        	return  $richtexteditor.settings.name;
        };
        
        function initComplete(){
            $.sbtools.initController.initComplete($richtexteditor, "$sbrichtexteditor", function(){
                if(!isContain()){
                    setter();
                }
            }, $richtexteditor.settings.onInitComplete);
        }

        function render() {
            $richtexteditor.addClass($richtexteditor.settings.className);
            $richtexteditor.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            if($richtexteditor.settings.id === null){
            	$richtexteditor.settings.id = $richtexteditor.attr("id") + "_richtexteditor";
            }
            renderTextArea();

            buildRichTextEditor();
            setter();
            return $richtexteditor;
        }

        function renderTextArea(){
        	var $textarea = $("<textarea></textarea>");
        	if($richtexteditor.settings.id) {
        		$textarea.attr("id", $richtexteditor.settings.id);
        	}
        	
        	if($richtexteditor.settings.name) {
        		$textarea.attr("name", $richtexteditor.settings.name);
        	}
        	
        	$textarea.attr('required', $richtexteditor.settings.required);
        	
            $richtexteditor.append($textarea);
            $richtexteditor._$textarea = $textarea;
        }
        
        function buildRichTextEditor(){
        	var options = {
	    		 uploadJson: $richtexteditor.settings.uploadUrl, 
	    		 allowFileManager: false,
	    		 width: $richtexteditor.settings.width,
	    	     height: $richtexteditor.settings.height,
	    	     resizeType:getResizeType(),
	    	     readonlyMode: $richtexteditor.settings.readonly || $richtexteditor.settings.disabled,
	    	     afterCreate:function(){
	    	    	 $richtexteditor.isCreatedEditor = true;
	    	    	 $richtexteditor._$editorContainer = $(this.container.get(0));
	    	        
	    	    	 toggleReadonlyClass($richtexteditor.settings.readonly);
	    	         
	    	         if($richtexteditor.data("$tempReadonly")){
	    	        	 var tempReadonly = $richtexteditor.data("$tempReadonly");
	    	        	 $richtexteditor.removeData("$tempReadonly");
	    	        	 
 	    	        	 $richtexteditor._editor.readonly(tempReadonly);
 	    	        	 toggleReadonlyClass(tempReadonly);
	    	         }
	    	         
	    	         if($richtexteditor.data("$tempDisabled")){
	    	        	 var tempDisabled = $richtexteditor.data("$tempDisabled");
	    	        	 $richtexteditor.removeData("$tempDisabled");
	    	        	 
	    	        	 $richtexteditor._editor.readonly(tempDisabled);
	    	         }
	    	         
	    	         if($richtexteditor.data("$tempSetValue")){
	    	        	 $richtexteditor.settings.value = $richtexteditor.data("$tempSetValue");
	    	        	 $richtexteditor.removeData("$tempSetValue");
	    	         }
	    	         if($richtexteditor.settings.value) {
	    	             $richtexteditor.setValue($richtexteditor.settings.value);
	    	         }
	    	            
	    	         initComplete();
	    	     }
	    	};
        	
        	var items = getToolBarItems();
        	if(items !== null && items.length > 0){
        		options.items = items;
        	}
        	
        	if($richtexteditor.settings.uploadUrl === ""){
        		options.allowImageUpload = false;
        	}
        	var koptions = $.extend({},$richtexteditor.settings.setting || {}, options);
	    	var editor = KindEditor.create($("#" + $richtexteditor.settings.id), koptions);
	    	$richtexteditor._editor =  editor;
        }
        
        /**
         * 设置只读的样式
         */
        function toggleReadonlyClass(flag){
            $.sbtools.toggleRichEditorReadonlyClass($richtexteditor._$editorContainer.find(".ke-edit"), flag);
        }
        
        function getResizeType(){
        	if($richtexteditor.settings.resizeType == "all"){
        		return 2;
        	}else if($richtexteditor.settings.resizeType == "height"){
        		return 1;
        	}else if($richtexteditor.settings.resizeType == "no"){
        		return 0;
        	}
        }
        
        function getToolBarItems(){
        	if($richtexteditor.settings.toolBarItems){
        		return $richtexteditor.settings.toolBarItems;
        	}
        	
        	if($richtexteditor.settings.mode == "simple"){
        		return [
        		         'source','undo', 'redo','|', 'justifyleft', 'justifycenter', 'justifyright',
        		         'justifyfull', 'insertorderedlist', 'insertunorderedlist', 'indent', 'outdent', 'clearhtml', '|',
        		         'formatblock', 'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold',
        		         'italic', 'underline', 'strikethrough', 'lineheight', 'removeformat', '|', 'image',
        		         'table', 'anchor', 'link', 'unlink','fullscreen','jme'
        		       ];
        	}else{
                //full		
        		return null;
        	}
        }
        
        /**
         * Main function
         */
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Select:普通的下拉选择组件
 * 
 * Dependency:sinobest-tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-select",
        required: false,
        readonly: false,
        disabled: false,
        allowEmptyOption: true,
        name: null,
        id: null,
        valueField: "code",
        labelField: "detail",
        value: null,
        data: null,
        url: null,
        multiple: false,
        size: null,
        onChange: null,
        callback: null,
        delimiter:null,
        onAjaxRequest: null, 
	    onAjaxResponse: null,
	    saveType:"c",
	    onInitComplete:null,
	    setValueTriggerChange:true
    };

    $.fn.sbselect = function (options) {
        var settings;
        var $select = this;
        if (isContain()) {
            if (options) {
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $select.settings = settings;

        function getter() {
            return $select.data("$select");
        }

        function setter() {
            $select.data("$select", $select);
        }

        function isContain() {
            return $select.data("$select");
        }
        
        $.sbbase.mixinWidget($select);

        /**
         * Get value
         * @return  object
         */
        $select.getValue = function () {
        	return getSelectedValues($select.settings.saveType);
        };
        
        function getSelectedValues(type){
            var values = [];
            if(type == "c"){
            	$select.$control.find("option:selected").each(function(index, element){
            		if(typeof($(element).attr("value")) != "undefined"){
            			values.push($(element).val());
            		}
            	});
            }else{
            	$select.$control.find("option:selected").each(function(index, element){
            		if(typeof($(element).attr("value")) != "undefined"){
            			values.push($(element).text());
            		}
            	});
            }
            
            if($select.settings.delimiter){
            	return values.join($select.settings.delimiter);
            }
            
            if(!$select.settings.multiple){
            	return values.length > 0 ? values[0] : "";
            }
            return values;
        }

        $select.getLabel = function(){
        	return getSelectedValues("d");
        };
        
        /**
         * Set value
         * @param value new value
         * @return object
         */
        $select.setValue = function (value) {
        	doSetValue(value, function(){
        		triggerChangeWhenSetValue();
        	});
        };
        
        function doSetValue(value, completeCallBack){
            // 异步请求中，如果请求未结束，将value存储于内存中，请求结束后从内存中读值
            if (!$select.settings.data) {
                $select.data('$temp', value);
                return $select;
            }
            
            //清空之前选择的值
            $select.$control.find("option:selected").each(function(index, element){
            	 $(element).attr("selected", false);
            });
            
            if(value == null || value == undefined){
            	value = "";
            }
            
            if(!$.isArray(value)){
        	    if($select.settings.delimiter){
        	    	value = value.split($select.settings.delimiter);
                }else{
                	value = [value];
                }
        	}
            
            if($select.settings.saveType == "c"){
            	 $select.$control.val(value);
            }else{
            	for(var i = 0, length = value.length; i < length; i++){
            	   $select.$control.find("option").not(":selected").each(function(index, element){
               		   if($(element).text() == value[i]){
               			   $(element).attr("selected", true);
               			   return false;
               		   }
                 	});
                }
            }
            
            // disabled Hack
            if ($select.settings.disabled && ($select.settings.multiple || $select.settings.size)) {
                // option.addClass('option-selected');
                $select.$control.find("option").not(":selected").removeClass("option-selected");
                $select.$control.find("option:selected").addClass("option-selected");
            }

            $select.settings.value = value;
            
            if(completeCallBack){
            	completeCallBack();
            }
            return $select;
        }
        
        function triggerChangeWhenSetValue(){
        	if($.isFunction($select.settings.onChange) && $select.settings.setValueTriggerChange){
             	$select.$control.trigger("change");
            }
        }
        
        $select.getName = function(){
            return $select.$control.attr('name');
        };
         
        /**
         * Set new state
         * @param stateJson state json
         * @return  object
         */
        $select.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
                if (v !== undefined && v !== null) {
                    if (k == 'value') {
                        $select.setValue(v);
                    } else {
                        if (k == 'required') {
                            $select.settings.required = v;
                            $select.$control.attr("required", $select.settings.required);
                        } else if (k == 'disabled') {
                            $select.settings.disabled = v;
                            $select.$control.attr("disabled", $select.settings.disabled);
                            $.sbtools.toggleSelectDisabledClass($select.$control, v);
                        } else if(k == 'readonly'){
                        	$select.settings.readonly = v;
                        	readonly(v);
                        } else{
                        	$select.attr(k, v);
                        }
                    }
                } else {
                    $select.removeAttr(k);
                }
            });
            return $select;
        };
		
        $select.getDefaultOptions = function(){
        	return defaults;
        };

        /**
         * Reload
         * @return object
         */
        $select.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($select, "$sbselect");
            return render();
        };
        
        
        $select.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		$select.settings.data= null;
        		$select.settings.url = null;
        		
       		    if($.isArray(dataSource)){
       			   $select.settings.data = dataSource;
       		    }else{
       			   $select.settings.url = dataSource;
       		    }
       		    $select.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };
        
        /**
         * Validate
         */
        $select.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                var v = $select.getValue();
                var isOk = false;

                if (settings.required) {
                    isOk = $.sbvalidator.required($select.$control[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };
        
        $select.getSelectItems = function(){
        	var selectItems = [];
        	$select.$control.find("option:selected").each(function(index, element){
        		if($(element).data($.sbtools.CONSTANTS.DATA_SBITEM_KEY) != ""){
        			selectItems.push($(element).data($.sbtools.CONSTANTS.DATA_SBITEM_KEY));
        		}
        	});
        	return selectItems;
        };

        function initComplete(){
            $.sbtools.initController.initComplete($select, "$sbselect", function(){
                if(!isContain()){
                    setter();
                }
            }, $select.settings.onInitComplete);
        }
        
        /**
         * Init
         */
        function render() {
            if ($select.settings.multiple) {
                $select.html('<select multiple></select>');
                if($select.settings.size) {
                    $select.find("select").attr("size", $select.settings.size);
                }
            } else {
                $select.html('<select></select>');
            }

            $select.$control = $select.find("select");
            $select.addClass($select.settings.className);
            $select.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            if($select.settings.id) {
                $select.$control.attr('id', $select.settings.id);
            }
            if($select.settings.name) {
                $select.$control.attr('name', $select.settings.name);
            }
            
            $select.$control.attr('required', $select.settings.required);
            
            $select.$control.attr('disabled', $select.settings.disabled);
            $.sbtools.toggleSelectDisabledClass($select.$control, $select.settings.disabled);
            
            //disabled的优先级高于readonly
            if(!$select.settings.disabled){
            	readonly($select.settings.readonly);
            }
            
            if($select.settings.url){
            	var queryRequest = {};
            	if($select.settings.onAjaxRequest && $.isFunction($select.settings.onAjaxRequest)){
				   queryRequest = ($select.settings.onAjaxRequest)(queryRequest);
		        }
            	
                // same as getJSON
                $.ajax({
                    type: "post",
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data:JSON.stringify(queryRequest),
                    url: $select.settings.url,
                    success: function (data) {
                    	if($select.settings.onAjaxResponse && $.isFunction($select.settings.onAjaxResponse)){
   						   ($select.settings.onAjaxResponse)(data);
   					    }
                        $select.settings.data = data;
                        clearOption();
                        buildOption($select.settings.data);
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        var e = new Object();
                        e.code = XMLHttpRequest.status;
                        e.msg = $.sberror.format(e.code, this.url);
                        // 根据规范要求将错误交给全局函数处理
                        $.sberror.onError(e);
                    }
                });
            }else{
            	if(!$select.settings.data){
            		$select.settings.data = [];
            	}
            	// clear all option
                clearOption();
                // data reload
                buildOption($select.settings.data);
            }
            
            setter();
            return $select;
        }
        
        /**
         * 通过事件模拟readonly效果
         */
        function readonly(flag){
           $.sbtools.toggleSelectReadonlyClass($select.$control, flag);
           $.sbtools.eventSimulationSelectReadonly($select, $select.$control, flag);
        }
        
        function clearOption() {
            $select.$control.find("option").remove();
        };
        
        /**
         * As you see for build option
         */
        function buildOption(data) {
            if ($select.settings.allowEmptyOption) {
            	var $emptyOption = $("<option></option>");
            	$emptyOption.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, "");
            	
                $select.$control.append($emptyOption);
            }
            $.each(data, function (idx, obj) {
                var option = $("<option></option>");
                $.each(obj, function (k, v) {
                    var isAttr = true;
                    if (k == $select.settings.valueField) {
                        option.val(v);
                        isAttr = false;
                    }
                    if (k == $select.settings.labelField) {
                        option.text(v);
                        isAttr = false;
                    }
                    if (isAttr) {
                        option.attr(k, v);
                    }
                });
                option.data($.sbtools.CONSTANTS.DATA_SBITEM_KEY, obj);
                $select.$control.append(option);
            });

            addEventListener();
        };

        /**
         * Init value and add Event Listener
         * 因为有可能数据是异步加载过来的，所以初始化监听之类的操作，建议放在BuildOption之后
         */
        function addEventListener() {
            if ($select.settings.onChange) {
                $select.$control.off('change').on('change', function(){
                	var selectedValues = [];
                	$select.$control.find("option:selected").each(function(index, element){
                		if($.sbtools.isNotBlank($(this).attr("value"))){
                			var currentValue = {};
                          	currentValue[$select.settings.valueField] = $(this).attr("value");
                          	currentValue[$select.settings.labelField] = $(this).text();
                          	selectedValues.push(currentValue);
                		}
                	});
                	
                	
                	var args = null;
                	if(selectedValues.length <= 0){
                		args = {};
                		args[$select.settings.valueField] = "";
                		args[$select.settings.labelField] = "";
                	}else{
                		if($select.settings.multiple){
                			args = selectedValues;
                		}else{
                			args = selectedValues[0];
                		}
                	}
                	$select.settings.onChange.apply($select, [args]);
                });
            }
            
            $.sbtools.registerBaseEvent($select.$control, $select.settings, function(){
            	if($select.settings.readonly || $select.settings.disabled){
            		return false;
            	}
            	return true;
            });
            
            // 从内存中获取未赋的值
            if ($select.data('$temp')) {
                $select.settings.value = $select.data('$temp');
                $select.removeData('$temp');
            }
            
            if ($select.settings.value !== undefined && $select.settings.value !== null) {
                doSetValue($select.settings.value, function(){
                	initComplete();
                	triggerChangeWhenSetValue();
                });
            }else{
            	initComplete();
            }
        };

        /**
         * Main function
         */
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Tabs:页签组件
 * 
 * Dependency:jquery.ui.core.js,jquery.ui.widget.js,jquery.ui.tabs.js,sinobest.tools.js
 */
(function ($) {
	
    var defaults = {   
    	activeIndex:0,
    	disabled:false,
    	async:true,
    	tabPosition:"h",
    	tabMaxWidth:null,
    	tabWidthOverflow:"ellipsis", //newline(换行显示),ellipsis(不换行,隐藏以省略号显示)
    	onSelect:null,
    	onUnselect:null,
    	className:"sinobest-tabs",
    	style:null,
        tabs:null,
        subtabsConfig:null,
        onInitComplete:null
    };
    
    /**
     * 选择器常量
     */
    var SELECTORS = {
    	tabAnchor:               " > a.ui-tabs-anchor",          //tab页签中的锚点
    	tabPanel:                " > div.ui-tabs-panel",         //tab面板
    	subTabsClassName:        " .sinobest-tabs-sub"           //tab页签中的子tab
    };

    $.fn.sbtabs = function (options) {
        var $sbtabs = this;
        var settings;
        if (isContain()) {
            if (options) {
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $sbtabs.settings = settings;

        function getter() {
            return $sbtabs.data("$sbtabs");
        }

        function setter() {
        	$sbtabs.data("$sbtabs", $sbtabs);
        }
        
        function isContain() {
            return $sbtabs.data("$sbtabs");
        }

        $.sbbase.mixinWidget($sbtabs, {isAddValueMethod:false});
        
        /**
         * 设置选项卡控件状态
         */
        $sbtabs.setState = function(stateJson){
        	$.each(stateJson, function (k, v) {
        		 $sbtabs.attr(k, v);
            });
        	return $sbtabs;
        };
		
        $sbtabs.getDefaultOptions = function(){
        	return defaults;
        };
       
        /**
         * 重新装载选项卡控件,将选项卡重新构建
         */
        $sbtabs.reload = function(){
        	//#1 删除tabNav和调用增加方法增加的选项卡面板:
            //  是因为重新渲染的时候,tabNav是重新构建,调用增加方法增加的选项卡不在重新构建的选项卡考虑之中
        	_removeTabNavAndAddTabPanel($sbtabs);
        	
        	//#2 处理子tabs
        	if($sbtabs.subTabsList){
        		for(var i = 0; i < $sbtabs.subTabsList.length; i++){
        			var element = $sbtabs.subTabsList[i];
        			_removeTabNavAndAddTabPanel(element.subTabs);
        			element.subTabs.tabs("destroy");
        			element.subTabs.removeData("$sbtabs");
        		}
        	}
        	delete $sbtabs.subTabsList;
        	
        	$sbtabs.tabs("destroy");
        	$.sbtools.initController.removeInitCompleteFlag($sbtabs, "$sbtabs");
        	render();
        };
        
        function _removeTabNavAndAddTabPanel($tabsObj){
        	var tabNav = get$TabNav($tabsObj);
        	//删除增加的Tab的TabPanel
        	$(tabNav).find(">li[tab-added=true]").each(function(index, element){
        		var ariaControls = $(element).attr("aria-controls");
        		$tabsObj.find("#"+ariaControls).each(function(tabPanelIndex,tabPanelElement){
        			if($(tabPanelElement).hasClass("ui-tabs-panel")){
        				$(tabPanelElement).remove();
        			}
        		});
        	});
        	$(tabNav).remove();
        }
        
        /**
         * 设置选项卡不可用
         * @param index 为空表示设置全部不可用，否则设置指定的index不可用
         */
        $sbtabs.disable = function(index){
        	if(index == null || index == undefined){
        		$sbtabs.tabs("disable");
        	}else{
        		$sbtabs.tabs("disable",index);
        	}
        };
        
        /**
         * 设置选项卡可用
         * @param index 为空表示设置全部可用，否则设置指定的index可用
         */
        $sbtabs.enable = function(index){
        	if(index == null || index == undefined){
        		$sbtabs.tabs("enable");
        	}else{
        		$sbtabs.tabs("enable",index);
        	}
        };
        
        /**
         * 获取指定id的tab页签
         */
        $sbtabs.getTab = function(tabId){
        	var findTab = {};
        	var instance = $sbtabs.tabs("instance");
        	if(instance){
               instance.tabs.each(function(index, element){
            	   var tab = $(element);
            	   if(tab.attr("tab-id") == tabId){
            		   findTab.index = index;
            		   findTab.id = tabId;
            		   //tab页面控制的tabPanel的id
            		   findTab.ariaControls = $(tab).attr("aria-controls");
            		   findTab.subTabs = $sbtabs._getSubTabsByTabId(tabId);
            		   return false;
            	   }
               });      		
        	}
        	return findTab;
        };
        
        /**
         * 获取tab页签中的子tab
         */
        $sbtabs._getSubTabsByTabId = function(tabId){
        	if(typeof $sbtabs.subTabsList == "undefined"){
        		return null;
        	}
        	
        	for(var i = 0; i < $sbtabs.subTabsList.length; i++){
        		var element = $sbtabs.subTabsList[i];
        		if(element.id == tabId){
        			return element.subTabs;
        		}
        	}
        	 
        	return null;
        };
        
        /**
         * 获取当前激活的tab页签
         */
        $sbtabs.getActiveTab = function(){
        	var instance = $sbtabs.tabs("instance");
        	if(instance && instance.active){
        		 var activeTabId = (instance.active).attr("tab-id");
        		 return $sbtabs.getTab(activeTabId);
        	}
        	return {};
        };
        
        /**
         * 增加tab页签
         */
        $sbtabs.addTab = function(tabConfig){
        	//此属性的作用：当reload或removeTab的时候,需要将增加的TabPanel删除,否则页面中会一直存在增加的TabPanel
        	tabConfig.addTab = true;
        	
        	get$TabNav().append(_createTab(tabConfig));
        	$sbtabs.append(_createTabPanel(tabConfig));
        	$sbtabs.append(_createSubTabs(tabConfig));
        	$sbtabs.tabs("refresh");
        	
        	if(isVerticalPostion()){
        		addVerticalTabPanelMarkClass();
        	}
        	_adjustTabSize();
        	_adjustActiveTabPanelSize();
        	_adjustActiveTabPanelMarginLeft();
        };
        
        /**
         * 移除tab页签
         */
        $sbtabs.removeTab = function(tabId){
        	var tab = get$TabNav().find(">li[tab-id="+tabId+"]");
        	var tabPanelId = $(tab).remove().attr("aria-controls");
        	if($(tab).attr("tab-added")){
        		$("#"+tabPanelId).remove();
        	}else{
        		$("#"+tabPanelId).hide();
        	}
            $sbtabs.tabs("refresh");
            
            _adjustTabSize();
            _adjustActiveTabPanelMarginLeft();
        };
        
        /**
         * 激活面板
         */
        $sbtabs.activeTab = function(index){
        	$sbtabs.tabs('option', 'active', index);
        };
        
        function initComplete(){
            $.sbtools.initController.initComplete($sbtabs, "$sbtabs", function(){
                if(!isContain()){
                    setter();
                }
            }, $sbtabs.settings.onInitComplete);
        }
        
        /**
         * Init
         */
        function render() {
        	_renderSbTabs();
        	_renderTabList();
        	
        	_buildSbTabs();
        	
        	initComplete();
        	setter();
            return $sbtabs;
        }
        
        /**
         * 渲染tabs元素自身
         */
        function _renderSbTabs(){
        	if($sbtabs.settings.style){
        		$sbtabs.attr("style", $sbtabs.settings.style);
        	}
        	
        	if($sbtabs.settings.className){
        		$sbtabs.addClass($sbtabs.settings.className);
        	}
        	$sbtabs.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
        }
        
        /**
         * 渲染选项卡中的tab
         */
        function _renderTabList(){
        	if($sbtabs.settings.tabs == null || $sbtabs.settings.tabs.length <=0){
        		return;
        	}
        	
        	var $ul = $("<ul>");
        	for(var i = 0; i < $sbtabs.settings.tabs.length; i++){
        		var tabConfig = $sbtabs.settings.tabs[i];
            	
            	$ul.append(_createTab(tabConfig));
            	$sbtabs.append(_createTabPanel(tabConfig));
            	
            	_createSubTabs(tabConfig);
        	}
        	
        	$sbtabs.prepend($ul);
        	
        	$sbtabs._$tabNav = $ul;
        }
        
        /**
         * 获取tab导航
         */
        function get$TabNav($targetTab){
        	if($targetTab){
        		return $targetTab._$tabNav;
        	}else{
        		return $sbtabs._$tabNav;
        	}
        }
        
        /**
         * 获取tab页签
         */
        function get$Tabs(){
        	return get$TabNav().children("li"); 
        }
        
        /**
         * 创建tab的页签
         */
        function _createTab(tabConfig){
        	var $li = _createTabElement(tabConfig);
        	var $anchor = _createTabAnchorElement(tabConfig);
        	
        	$li.append($anchor);
        	if(tabConfig.showCloseButton){
        		$li.append(_createTabCloseBtnElement(tabConfig));
        	}
        	return $li;
        }
        
        /**
         * 创建tab页签元素
         */
        function _createTabElement(tabConfig){
        	var $li = $("<li>").attr("tab-id", tabConfig.id);
        	if(tabConfig.style){
        		$li.attr("style", tabConfig.style);
        	}
        	if(tabConfig.className){
        		$li.addClass(tabConfig.className);
        	}
        	
        	//通过调用增加方法增加的Tab
        	if(tabConfig.addTab){
        		$li.attr("tab-added", "true");
        	}
        	return $li;
        }
        
        /**
         * 创建tab页签中的锚点元素
         */
        function _createTabAnchorElement(tabConfig){
        	$.sbtools.isInPseudoProtocolBlackList(tabConfig.url, true);
        		 
        	var $a = $('<a href="'+tabConfig.url+'"></a>').text(tabConfig.title);
        	
        	//tab标签页中的文字支持换行或省略号显示
        	if($sbtabs.settings.tabMaxWidth != null){
        		$a.css("width",$sbtabs.settings.tabMaxWidth);
        		if($sbtabs.settings.tabWidthOverflow == "newline"){
        			$a.addClass("ui-tabs-width-overflow-newline");
        		}else if($sbtabs.settings.tabWidthOverflow == "ellipsis"){
        			$a.addClass("ui-tabs-width-overflow-ellipsis");
        			$a.attr("title",tabConfig.title);
        		}
        	}
        	
        	return $a;
        }
        
        /**
         * 创建tab页签中的关闭按钮
         */
        function _createTabCloseBtnElement(tabConfig){
        	return $('<span class="ui-icon ui-icon-close" role="presentation"></span>').bind("click", function(){
        		 $sbtabs.removeTab(tabConfig.id);
        	});
        }
        
        /**
         * 创建tab面板
         */
        function _createTabPanel(tabConfig){
        	//远程
        	if(tabConfig.contentBuilder == "remote"){
        		return $();
        	}else if(tabConfig.contentBuilder == "function"){
        		//函数
        		//reload的时候会重新渲染,存在的tabPanel不删除，在页面会显示多次
        		$("#"+tabConfig.id, $sbtabs).remove();
        		var funBuildContent = tabConfig.content();
        		return $("<div>").attr("id", tabConfig.id).html(funBuildContent);
        	}else{
        		//本地：默认
        		if(tabConfig.content == null){
        			return $();
        		}else{
        			$("#"+tabConfig.id, $sbtabs).remove();
        			return $("<div>").attr("id", tabConfig.id).html(tabConfig.content);
        		}
        	}
        }
        
        /**
         * 创建tab面板中的子tab选项卡
         */
        function _createSubTabs(tabConfig){
        	if(tabConfig.subTabsConfig == null){
        		return;
        	}
        	//创建子的tab选项
        	var $subTabs = $("#" + tabConfig.id).find(SELECTORS.subTabsClassName).sbtabs(tabConfig.subTabsConfig);
        	if($subTabs){
        		$subTabs.removeClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
        	}
        	
        	if(typeof $sbtabs.subTabsList == "undefined"){
        		$sbtabs.subTabsList = new Array();
        	}
        	$sbtabs.subTabsList.push({id:tabConfig.id, subTabs:$subTabs});
        }
        
        /**
         * 构建选项卡
         */
        function _buildSbTabs(){
           $sbtabs.tabs({
 		        active:$sbtabs.settings.activeIndex,
 		        disabled:$sbtabs.settings.disabled,
 		        beforeLoad:function(event, ui){
 		        	//设置同步还是异步加载方式
 		        	ui.ajaxSettings.async = $sbtabs.settings.async;
 		        },
 		        //[注意：远程面板加载的内容,只能在load方法才能正确获取height]
 		        load:function(event, ui){
 		            _adjustActiveTabPanelSize();
 	 		        _adjustActiveTabPanelMarginLeft();
 		        },
 		        //[注意：远程面板和本地面板激活时候都会调用此法,要正确操作远程面板(如获取高度)请在load方法中处理]
 		        activate:function(event, ui){
 		           if(!isRemoteTabPanel(ui.newPanel)){
 		        		_adjustActiveTabPanelSize();
 		        		_adjustActiveTabPanelMarginLeft();
 		           }
 		        	
 		           //触发取消选择tab页签的事件
 		           if(typeof $sbtabs.settings.onUnselect == "function"){
 		        	   $sbtabs.settings.onUnselect($sbtabs.getTab($(ui.oldTab).attr("tab-id")));
 		           }
 		           
 		           //触发选择tab页签的事件
  		           if(typeof $sbtabs.settings.onSelect == "function"){
  		        	   $sbtabs.settings.onSelect($sbtabs.getTab($(ui.newTab).attr("tab-id")));
  		           }
 		        },
 		        //[注意：初始化创建激活的面板的时候不会触发activate事件]
 		        create:function(event, ui){
 		           //触发选择tab页签的事件
  		           if(typeof $sbtabs.settings.onSelect == "function"){
  		        	    $sbtabs.settings.onSelect($sbtabs.getTab($(ui.tab).attr("tab-id")));
  		           }
  		          
 		        }
 	       });  
        	
           //选项卡中的页签竖排显示
           if(isVerticalPostion()){
        	   $sbtabs.tabs().addClass("ui-tabs-vertical ui-helper-clearfix");
        	   get$Tabs().removeClass("ui-corner-top").addClass("ui-corner-left");
        	   get$TabNav().addClass("ui-tabs-vertical-nav");
        	        
        	   addVerticalTabPanelMarkClass();
        	   
        	   //子选项卡竖排显示
        	   if(_isSubTabs()){
        		   $sbtabs.tabs().addClass("ui-tabs-sub-vertical");
        	   }
           }
           
           _adjustTabSize();
    	   if(!isRemoteTabPanel(getActiveTabPanel())){
    		   _adjustActiveTabPanelSize();
    		   _adjustActiveTabPanelMarginLeft();
    	   }
        }
        
        /**
         * 获取激活的面板
         */
        function getActiveTabPanel(){
        	 var activeTab = $sbtabs.getActiveTab();
      	     return $sbtabs.find("#" + activeTab.ariaControls);
        }
        
        /**
         * 是否远程面板
         */
        function isRemoteTabPanel($panel){
        	//参考jquery.ui.tabs.js中的源码
        	if($panel.attr("aria-live") == "polite"){
        		return true;
        	}
        	return false;
        }
        
        /**
         * 是垂直方向显示
         */
        function isVerticalPostion(){
        	return ($sbtabs.settings.tabPosition == "v");
        }
        
        function addVerticalTabPanelMarkClass(){
          	 $sbtabs.find(SELECTORS.tabPanel).addClass("ui-tabs-vertical-panel");
        }
        
        /**
         * 调整tab页签的大小:包括高度和宽度.
         */
        function _adjustTabSize(){
        	_adjustTabHeight();
            _adjustTabWidth();
        }
        
        /**
         * 当tabPosition为横排显示且设置tabMaxWidth和tabWidthOverflow为newline,将所有的tab页签设置为最高高度的tab
         */
        function _adjustTabHeight(){
        	if($sbtabs.settings.tabPosition != "h"){
        		return;
        	}
        	if($sbtabs.settings.tabMaxWidth == null || $sbtabs.settings.tabWidthOverflow != "newline"){
        		return;
        	}
     
        	//当存在子的tab时,如果子tab的父tab没有激活，则获取的高度都是为0
        	var isSubTabs = _isSubTabs();
        	var preVisibleIsHidden = $sbtabs.is(":hidden");
        	if(isSubTabs && preVisibleIsHidden){
        		$sbtabs.parent().show();
        	}
        	
        	//获取所有tab中最高的高度
        	var maxHeight = 0;
        	//注：此处为什么不从$sbtabs.settings.tabs中获取循环tab了？
        	//   因为addTab操作也会调整高度,从$sbtabs.settings.tabs中无法获取的新增的Tab
        	var tabList = get$Tabs();
        	for(var i = 0; i < tabList.length; i++){
        		var tab = tabList[i];
        		
        		var tabAnchor = $(tab).find(SELECTORS.tabAnchor);
        		//注：此处为什么要设置初始化高度属性？
        		//   当增加或删除tab的时候，需要动态调整高度，也不是一直固定最高的高度
        		var tabAnchorInitHeight = $(tabAnchor).attr("tab-anchor-initheight");
        		if(tabAnchorInitHeight == null){
        			tabAnchorInitHeight = $(tabAnchor).height();
        			$(tabAnchor).attr("tab-anchor-initheight", tabAnchorInitHeight);
        		}
        		maxHeight = Math.max(maxHeight, tabAnchorInitHeight);
        	}
        	 
        	//调整所有的tab高度
        	$.each(tabList, function(index, element){
        		 $(element).find(SELECTORS.tabAnchor).height(maxHeight);
        	});
        	
        	if(isSubTabs && preVisibleIsHidden){
        		$sbtabs.parent().hide();
        	}
        }
        
        /**
         * 当设置tabMaxWidth,将所有的tab页签宽度设置为最宽的那个宽度
         */
        function _adjustTabWidth(){
        	if($sbtabs.settings.tabMaxWidth == null){
        		return;
        	}
        	
        	//当存在子的tab时,如果子tab的父tab没有激活，则获取的宽度都是为0
        	var isSubTabs = _isSubTabs();
        	var preVisibleIsHidden = $sbtabs.is(":hidden");
        	if(isSubTabs && preVisibleIsHidden){
        		$sbtabs.parent().show();
        	}
        	
        	//获取所有tab中最大的宽度
        	var maxWidth = 0;
        	//注：此处为什么不从$sbtabs.settings.tabs中获取循环tab了？
        	//   因为addTab操作也会调整宽带,从$sbtabs.settings.tabs中无法获取的新增的Tab
        	var tabList = get$Tabs();
        	for(var i = 0; i < tabList.length; i++){
        		var tab = tabList[i];
        		
        		//注：此处为什么要设置初始化宽度属性？
        		//   当增加或删除tab的时候，需要动态调整宽度，也不是一直固定最宽的宽度
        		var tabInitWidth = $(tab).attr("tab-initwidth");
        		if(tabInitWidth == null){
        			tabInitWidth = $(tab).width();
        			$(tab).attr("tab-initwidth", tabInitWidth);
        		}
        		maxWidth = Math.max(maxWidth, tabInitWidth);
        	}
            
        	//调整所有的tab宽度
        	$.each(tabList, function(index, element){
        		 $(element).width(maxWidth);
        	});
        	
        	if(isSubTabs && preVisibleIsHidden){
        		$sbtabs.parent().hide();
        	}
        }
        
        /**
         * 调整激活面板的大小  <br>
         * 
         * 对于垂直显示的远程tab面板要保证此方法只能是在load事件触发，否则获取的高度会不准确
         */
        function _adjustActiveTabPanelSize(){
        	if($sbtabs.settings.tabPosition != "v"){
        		return;
        	}
        	
        	var $activeTabPanel = getActiveTabPanel();
  	        var activeTabHeight = $activeTabPanel.height();
  	        var navHeight = get$TabNav().height();
      	    if(navHeight > activeTabHeight){
      		    $activeTabPanel.height(navHeight);
      	    }
        }
        
        /**
         * 调整激活面板的margin-left属性 <br>
         * 
         * 垂直显示的时候,tab面板不能覆盖tab导航
         */
        function _adjustActiveTabPanelMarginLeft(){
        	 if($sbtabs.settings.tabPosition != "v"){
        		 return;
        	 }
        	 getActiveTabPanel().css("margin-left", get$TabNav().outerWidth());
        }
        
        /**
         * 是否子的选项卡
         */
        function _isSubTabs(){
        	return $sbtabs.hasClass("sinobest-tabs-sub");
        }
        
        /**
         * Main function
         */
        return this.each(function () {
            render();
        });
        
    };
	
})(jQuery);/**
 * Sinobest-Text:文本框组件
 * 
 * Dependency:sinobest.placeholder.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className:"sinobest-text",
        required:false,
        minlength:null,
        maxlength:null,
        placeholder:null,
        disabled:false,
        readonly:false,
        regex:null,
        callback:null,
        value:null,
        onChange:null,
        onInitComplete:null,
        setValueTriggerChange:true
    };

    $.fn.sbtext = function (options) {
        var $input = this;
        var settings;
        if(isContain()){
            if(options){
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({},getter().settings,options||{});
            }else{
                return getter();
            }
        }else{
            settings = $.extend({}, defaults, options || {});
        }

        $input.settings = settings;

        function getter(){
           return $input.data("$input");
        }
        function setter(){
            $input.data("$input",$input);
        }
        
        function isContain(){
            return $input.data("$input");
        }
        
        $.sbbase.mixinWidget($input);
        
       
        /**
         * Get text value
         * @return  object
         */
        $input.getValue = function () {
        	if($input.val() === $input.settings.placeholder){
        		return "";
        	}
            return $.trim($input.val());
        };

        /**
         * Set text value
         * @param value new value
         * @return object
         */
        $input.setValue = function (value) {
            doSetValue(value, function(){
            	triggerChangeWhenSetValue();
            })
            return $input;
        };
        
        function doSetValue(value, completeCallBack){
        	$input.val(value);
            $input.settings.value = value;
            if(completeCallBack){
            	completeCallBack();
            }
        }
        
        function triggerChangeWhenSetValue(){
        	 if($.isFunction($input.settings.onChange) && $input.settings.setValueTriggerChange){
             	$input.trigger("change");
             }
        }
        
        /**
         * Set text new state
         * @param stateJson state json
         * @return  object
         */
        $input.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null) {
                    if (k == 'value') {
                        $input.setValue(v);
                    } else {
                        if (k == 'required') {
                            $input.settings.required = v;
                        } else if (k == 'readonly') {
                            $input.settings.readonly = v;
                            $.sbtools.toggleInputReadonlyClass($input, v);
                        } else if(k == 'disabled'){
                            $input.settings.disabled = v;
                            $.sbtools.toggleInputDisabledClass($input, v);
                        }
                        $input.attr(k, v);
                    }
                } else {
                    $input.removeAttr(k);
                }
            });
            return $input;
        };
		
        $input.getDefaultOptions = function(){
            return defaults;	
        };

        /**
         * Reload text
         * @return object
         */
        $input.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($input, "$sbinput");
            return render();
        };
        /**
         * Validate input
         */
        $input.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                // basic validate
                var v = $input.getValue();

                var isOk = false;
                if (settings.required) {
                    isOk = $.sbvalidator.required($input[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                if (settings.minlength) {
                    isOk = $.sbvalidator.minlength($input[0], v, settings.minlength);
                    if (!isOk) {
                        return $.sbvalidator.minLengthPromptMessage(settings.minlength);
                    }
                }
                if (settings.maxlength) {
                    isOk = $.sbvalidator.maxlength($input[0], v, settings.maxlength);
                    if (!isOk) {
                        return $.sbvalidator.maxLengthPromptMessage(settings.maxlength);
                    }
                }
                
                if (settings.regex && $.sbtools.isNotBlank(v)) {
                    isOk = $.sbvalidator.valid(settings.regex, v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REGEX;
                    }
                }
                return ""; //验证通过
            }
        };

        $input.getName = function(){
        	return $input.attr("name");
        };
        
        function initComplete(){
            $.sbtools.initController.initComplete($input, "$sbinput", function(){
                if(!isContain()){
                    setter();
                }
            },  $input.settings.onInitComplete);
        }
        
        /**
         * Init
         */
        function render() {
        	$input.addClass($.sbtools.CONSTANTS.UICLASS.TEXT_COMMON);
            $input.addClass($input.settings.className);
            $input.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            $input.attr('required', $input.settings.required);
          
            if($input.settings.placeholder !== undefined && $input.settings.placeholder !== null) {
                $input.attr('placeholder', $input.settings.placeholder);
                // 测试是否支持
                if (!$.sbtools.isPlaceHolderSupported()) {
                    $input.placeholder();
                }
            }
            
            $input.attr('readonly', $input.settings.readonly);
            $.sbtools.toggleInputReadonlyClass($input, $input.settings.readonly);
            
            $input.attr('disabled', $input.settings.disabled);
            $.sbtools.toggleInputDisabledClass($input, $input.settings.disabled);
            
            if($.isFunction($input.settings.onChange)){
            	$input.on("change", function(){
            		$input.settings.onChange.apply($input, [$input.getValue()]);
            	});
            }
            
            $.sbtools.registerBaseEvent($input, $input.settings);
            
            if ($input.settings.value !== undefined && $input.settings.value !== null) {
            	doSetValue($input.settings.value, function(){
            		 initComplete();
            		 triggerChangeWhenSetValue();
            	});
            }else{
            	initComplete();
            }
           
            setter();
            return $input;
        }

        /**
         * Main function
         */
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Textarea:文本域组件
 * 
 * Dependency:sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className:"sinobest-textarea",
        required:false,
        minlength:null,
        maxlength:null,
        disabled:false,
        readonly:false,
        callback:null,
        value:null,
        resize:false,  //控制google浏览器是否能拖动文本域的大小
        onChange:null,
        onInitComplete:null,
        setValueTriggerChange:true
    };

    $.fn.sbtextarea = function (options) {
        var $textarea = this;
        var settings;
        if(isContain()){
            if(options){
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({},getter().settings,options||{});
            }else{
                return getter();
            }
        }else{
            settings = $.extend({}, defaults, options || {});
        }

        $textarea.settings = settings;

        function getter(){
           return $textarea.data("$textarea");
        }
        
        function setter(){
        	$textarea.data("$textarea", $textarea);
        }
        
        function isContain(){
            return $textarea.data("$textarea");
        }
        
        $.sbbase.mixinWidget($textarea);
        
        /**
         * Get text value
         * @return  object
         */
        $textarea.getValue = function () {
            return $.trim($textarea.val());
        };

        /**
         * Set text value
         * @param value new value
         * @return object
         */
        $textarea.setValue = function (value) {
            doSetValue(value, function(){
            	triggerChangeWhenSetValue();
            });
            return $textarea;
        };
        
        function doSetValue(value, completeCallBack){
        	$textarea.val(value);
            $textarea.settings.value = value;
            if(completeCallBack){
            	completeCallBack();
            }
        }
        
        function triggerChangeWhenSetValue(){
        	 if($.isFunction($textarea.settings.onChange) && $textarea.settings.setValueTriggerChange){
             	$textarea.trigger("change");
             }
        }
        
        /**
         * Set text new state
         * @param stateJson state json
         * @return  object
         */
        $textarea.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null){
                    if (k == 'value') {
                    	$textarea.setValue(v);
                    } else {
                        if (k == 'required') {
                        	$textarea.settings.required = v;
                        } else if (k == 'readonly') {
                        	$textarea.settings.readonly = v;
                        	$.sbtools.toggleTextareaReadonlyClass($textarea, v);
                        } else if(k == 'disabled'){
                        	$textarea.settings.disabled = v;
                        	$.sbtools.toggleInputDisabledClass($textarea, v);
                        }
                        $textarea.attr(k, v);
                    }
                } else {
                	$textarea.removeAttr(k);
                }
            });
            return $textarea;
        };
		
        $textarea.getDefaultOptions = function(){
        	return defaults;
        };

        /**
         * Reload text
         * @return object
         */
        $textarea.reload = function () {
        	$.sbtools.initController.removeInitCompleteFlag($textarea, "$sbtextarea");
            return render();
        };
        
        /**
         * Validate input
         */
        $textarea.validate = function () {
            var isFunc = $.isFunction(settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                // basic validate
                var v = $textarea.getValue();

                var isOk = false;
                if (settings.required) {
                    isOk = $.sbvalidator.required($textarea[0], v);
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                if (settings.minlength) {
                    isOk = $.sbvalidator.minlength($textarea[0], v, settings.minlength);
                    if (!isOk) {
                        return $.sbvalidator.minLengthPromptMessage(settings.minlength);
                    }
                }
                if (settings.maxlength) {
                    isOk = $.sbvalidator.maxlength($textarea[0], v, settings.maxlength);
                    if (!isOk) {
                        return $.sbvalidator.maxLengthPromptMessage(settings.maxlength);
                    }
                }
                return ""; //验证通过
            }
        };

        /**
         * 获取控件的name
         */
        $textarea.getName = function(){
        	return  $textarea.attr("name");
        };
        
        function initComplete(){
             $.sbtools.initController.initComplete($textarea, "$sbtextarea", function(){
                  if(!isContain()){
                      setter();
                  }
             }, $textarea.settings.onInitComplete);
         }
        
        /**
         * Init
         */
        function render() {
            $textarea.addClass($textarea.settings.className);
            $textarea.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            $textarea.attr('required', $textarea.settings.required);
           
            $textarea.attr('readonly', $textarea.settings.readonly);
            $.sbtools.toggleTextareaReadonlyClass($textarea, $textarea.settings.readonly);
            
            $textarea.attr('disabled', $textarea.settings.disabled);
            $.sbtools.toggleInputDisabledClass($textarea, $textarea.settings.disabled);
            
            if($textarea.settings.resize){
            	$textarea.css('resize', 'both');
            }else{
            	$textarea.css('resize', 'none');
            } 
            
            if($.isFunction($textarea.settings.onChange)){
            	$textarea.on("change", function(){
            		$textarea.settings.onChange.apply($textarea, [$textarea.getValue()]);
            	});
            }
            
            $.sbtools.registerBaseEvent($textarea, $textarea.settings);

            if($textarea.settings.value !== undefined && $textarea.settings.value !== null) {
            	doSetValue($textarea.settings.value, function(){
            		 initComplete();
            		 triggerChangeWhenSetValue();
            	});
            }else{
            	initComplete();
            }
            
            setter();
            return $textarea;
        }
       
        /**
         * Main function
         */
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Tools:通用工具组件
 * 
 * Dependency:sinobest-base.js
 */
(function ($) {
	
	$.extend({sbtools:{}});
	
    $.extend($.sbtools, {
    	 
    	    CONSTANTS : {
    	    	 
    	    	 /**
    	    	  * 字符串默认的分隔符
    	    	  */
    	    	 DEFAULT_DELIMITER : ";",
    	    	 
    	    	 /**
    	    	  * 明细项关键字
    	    	  */
    	    	 DATA_SBITEM_KEY:"data-sbitem",
    	    	 
    	    	 UICLASS:{
    	    		 
    	    		 /**
    	    		  * 输入的input控件
    	    		  */
    	    		 TEXT_COMMON:"sinobest-text-common",
    	    		 
    	    		 /**
    	    		  * ui控件标示
    	    		  */
    	    		 BASE_UI:"sinob-widget"
    	    	 }
    	    },
    	    
    	    isIE:function(){
    	    	if(navigator.userAgent.indexOf("MSIE") > 0){
             		 return true;
             	}
            	return false;
    	    },
    	    
    		/**
    		 * 是否IE6浏览器
    		 */
    		isIE6:function(){
    			if(navigator.userAgent.indexOf("MSIE") > 0 
                  		&& navigator.userAgent.indexOf("MSIE 6.0") > 0){
             		 return true;
             	}
            	return false;
    		},
    		
    		/**
    		 * 是否IE7浏览器
    		 */
    		isIE7:function(){
    	        if(navigator.userAgent.indexOf("MSIE") > 0 
    	              		&& navigator.userAgent.indexOf("MSIE 7.0") > 0){
    	         		return true;
    	        }
    	        return false;
    	    },
    	    
    	    /**
    	     * 是否IE8浏览器
    	     */
            isIE8:function(){
                if(navigator.userAgent.indexOf("MSIE") > 0 
 	              		&& navigator.userAgent.indexOf("MSIE 8.0") > 0){
 	         		return true;
 	            }
 	            return false;
            },
    	    
    	    /**
    	     * 是IE6或者IE7
    	     */
    	    isIE6OrIE7:function(){
    	    	if(this.isIE6() || this.isIE7()){
    	    		return true;
    	    	}
    	    	return false;
    	    },
    	    
    	    /**
    	     * 给定的参数值是否为空
    	     */
    	    isBlank:function(value){
    	    	if(value === "" || value === undefined || value === null || $.trim(value).length <= 0){
    				return true;
    			}
    			return false;
    	    },
    	    
    	    /**
    	     * 给定的参数值是否不为空
    	     */
    	    isNotBlank:function(value){
    	    	return !this.isBlank(value);
    	    },
    	    
    	    /**
    	     * 是否支持placeholder
    	     */
    	    isPlaceHolderSupported:function(){
    	    	 return ('placeholder' in document.createElement('input'));
    	    },
    	    
            toggleInputReadonlyClass:function($input, flag){
            	 this._toggleClass($input, "input-readonly", flag);
            },
            
            _toggleClass : function($domControl, className, flag){
            	if(flag){
            		$domControl.addClass(className);
            	}else{
            		$domControl.removeClass(className);
            	}
            },
            
            toggleSelectReadonlyClass:function($select, flag){
            	this._toggleClass($select, "select-readonly", flag);
            },
            
            toggleDateReadonlyClass:function($date, flag){
            	this._toggleClass($date, "date-readonly", flag);
            },
            
            toggleTextareaReadonlyClass:function($textarea, flag){
            	this._toggleClass($textarea, "textarea-readonly", flag);
            },
            
            toggleRichEditorReadonlyClass:function($richEditor, flag){
            	this._toggleClass($richEditor, "ke-readonly", flag);
            },
            
            toggleDivInputReadonlyClass:function($divInputControl, flag){
            	this._toggleClass($divInputControl, "div-input-readonly", flag);
            },
            
            toggleInputDisabledClass:function($input, flag){
            	 this._toggleClass($input, "input-disabled", flag);
            },
            
            toggleSelectDisabledClass:function($select, flag){
            	this._toggleClass($select, "select-disabled", flag);
            },
            
            /**
             * 转换设置的值
             * 
             * 1.对象数组:原样返回
             * 2.字符串数组：默认分隔符连接的字符串返回
             * 3.字符串：原样返回
             */
            convertSetValue : function(value){
            	if($.isArray(value) && value.length > 0){
            		if(typeof value[0] !== "object"){
            			return value.join($.sbtools.CONSTANTS.DEFAULT_DELIMITER);
            		}
            	}
            	return value;
            },
            
            /**
             * 调整input(text,textarea)弹出的下拉容器的位置.当标签控件太靠窗口右边的时候，需要调整容器的left距离
             * @param $input input的jquery对象
             * @param $dropdownContainer 下拉容器的jquery对象
             * @param addDropDownWidth   在下拉容器的宽度上在增加的宽度
             */
            adjustInputPopupDropdownContainerPosition:function($input, $dropdownContainer, addDropDownWidth){
				  var inputOffset = $input.offset();
				    
				  //设置left为0是为了获取弹出容器实际的宽度
				  $dropdownContainer.css({"left":"0px"});
	    	      var popupWidth = $dropdownContainer.outerWidth(true);
	    	      var availableWidth = $(window).width() - inputOffset.left;
	    
	    	      //考虑外部包装的父元素设置position=relative的情况
	  	          var $relativeParent = $("<test></test>");
	  	          $dropdownContainer.parents().each(function(){
		    	      if($(this).css("position") == "relative"){
		    	    	 $relativeParent = $(this);
		    	    	 return false;
		    	      }
		    	  });
	           
	    	      //减去30是因为IE获取的实际宽度还是不够用
	  	          //IE10-IE7不需要减去30,IE6需要.
	  	          var compatibilityValue = 0;
	  	          if(addDropDownWidth !== undefined && !isNaN(addDropDownWidth)){
	  	        	   compatibilityValue = addDropDownWidth;
	  	          }
	  	          if(this.isIE6()){
	  	        	compatibilityValue = 30;
	  	          }
	  	          
	  	          
	    	      if(availableWidth - popupWidth > compatibilityValue){
	    	    	  $dropdownContainer.css({left:(inputOffset.left -  $relativeParent.offset().left) + "px", 
	    	        	                      top :(inputOffset.top  +  $input.outerHeight() - $relativeParent.offset().top) + "px"}).slideDown("fast");
	    	      }else{
	    	    	  //当弹出容器靠近窗口最右边时,页面未出现滚动条,弹出容器显示后，若出现滚动条，需要调整弹出容器的位置,否则弹出容器会换行显示
	    	    	  var hasScrollYBeforeShow = $.sbtools.hasScrollY();
	    	    	  $dropdownContainer.css({left:($(window).width() - popupWidth - $relativeParent.offset().left - compatibilityValue) + "px", 
	    	    		                      top :(inputOffset.top   + $input.outerHeight() - $relativeParent.offset().top) + "px"}).slideDown("fast", function(){
	    	    		                    	  //显示前和显示后滚动条不一致,则调整位置  
	    	    		                    	  if(hasScrollYBeforeShow !== $.sbtools.hasScrollY()){
	    	    		                    		    //此时的$(window).width()会减去滚动条的宽度
	    	    		                    	    	$dropdownContainer.css({left:($(window).width() - popupWidth - $relativeParent.offset().left - compatibilityValue) + "px"});
	    	    		                    	    }
	    	    		                      });
	    	      }
			
            },
            
            /**
             * 是否存在Y轴的滚动条调
             * 参见地址：http://my.oschina.net/oncereply/blog/38511
             */
            hasScrollY: function(el) {
          	  // test targets
              var elems = el ? [el] : [document.documentElement, document.body];
              /*var scrollX = false;*/
              var scrollY = false;
              for (var i = 0; i < elems.length; i++) {
                  var o = elems[i];
                  // test horizontal
                 /* var sl = o.scrollLeft;
                  o.scrollLeft += (sl > 0) ? -1 : 1;
                  o.scrollLeft !== sl && (scrollX = scrollX || true);
                  o.scrollLeft = sl;*/
                  
                  // test vertical
                  var st = o.scrollTop;
                  o.scrollTop += (st > 0) ? -1 : 1;
                  o.scrollTop !== st && (scrollY = scrollY || true);
                  o.scrollTop = st;
              }
              return scrollY;
          },
          
            /**
             * 是非空对象.
             * 
             * 是非空的定义:对象不能等于undefined且不能等于null.当是字符串时,不能等于""且$.trim(object).length必须大于0,
             */
            isNonNull: function(object){
            	if(object !== undefined && object !== null){
            		if(typeof object === "string"){
            			if(object !== "" && $.trim(object).length > 0){
            				return true;
            			}
            		}else{
            			return true;
            		}
            	}
            	return false;
            },
            
            /**
             * 基本的事件类型
             * change为什么没有在此配置？因为change事件已经作为控件的基本配置,不需要在重复注册
             */
            baseUIEvent:["click"],
            
            /**
             * 注册基本事件
             * @param $registerControl 需要注册的控件的jquery对象
             * @param settings         获取注册事件函数的配置对象
             *        {
             *         onClick:function(){}
             *        }
             * @param judgmentCallBack 回调函数是否执行的裁决回调  可为空
             */
            registerBaseEvent : function($registerControl, settings, judgeCallBack){
                for(var i = 0; i < this.baseUIEvent.length; i++){
                	var registerEvent = this.baseUIEvent[i];
                	var eventName = registerEvent.substring(0,1).toUpperCase( ) +  registerEvent.substring(1);
                	var func = settings["on" + eventName];
                	if(func && $.isFunction(func)){
                		$registerControl.on(registerEvent, function(){
                			if($.isFunction(judgeCallBack)){
                				if(judgeCallBack()){
                					func.apply($registerControl.get(0));
                				}
                			}else{
                				func.apply($registerControl.get(0));
                			}
                		});
                	}
                }
            },
            
            /**
             * 事件模拟select只读
             * @param $selectParent  IE中事件模拟,select需要包装一个父元素,如span
             * @param $select        select的jquery对象
             * @param flag           只读标示
             */
            eventSimulationSelectReadonly:function($selectParent, $select, flag){
            	  if($.sbtools.isIE()){
                    if(flag){
                    	$selectParent.on("mousemove.select.readonly", function(){
               		       this.setCapture();
               	        });

                    	$selectParent.on("mouseout.select.readonly", function(){
               		        this.releaseCapture();
               	        });
               	  
                    	$selectParent.on("focus.select.readonly", function(){
               		       this.blur();
               	        });
                    }else{
                    	$selectParent.off("mousemove.select.readonly");
                    	$selectParent.off("mouseout.select.readonly");
                    	$selectParent.off("focus.select.readonly");
                    }
                 }else{
                 	if(flag){
                 		$select.on("focus.select.readonly mousedown.select.readonly mouseout.select.readonly mouseover.select.readonly", 
                     			function(){
                         	 $(this).blur();
                         	 return false;
                         });
                 	}else{
                 		$select.off("focus.select.readonly mousedown.select.readonly mouseout.select.readonly mouseover.select.readonly");
                 	}
                 }
            },
            
            /**
             * 初始化控制器
             */
            initController:{
            	
            	 /**
            	  * 初始化名称的后缀
            	  */
            	 initNameSuffix :"Init",
            	 
            	 /**
            	  * 初始化完成
            	  * $control:控件的jquery对象
            	  * initName:初始化的名字
            	  * beforeOnInitComplete:初始化完成之前的回调函数
            	  * onInitComplete:初始化完成回调函数
            	  */
            	 initComplete:function($control, initName, beforeOnInitComplete, onInitComplete){
                 	if(this.isInitComplete($control, initName)){
                 		return;
                 	}
                 	this.setInitCompleteFlag($control, initName);
                    if(onInitComplete && $.isFunction(onInitComplete)){
                    	if(beforeOnInitComplete && $.isFunction(beforeOnInitComplete)){
                     		beforeOnInitComplete();
                     	}
                    	onInitComplete.apply($control);
                    }
                 },
                 
                 /**
                  * 是否已经初始化
                  */
                 isInitComplete:function($control, initName){
                 	return $control.data(initName + this.initNameSuffix);
                 },
                 
                 /**
                  * 设置初始化标志
                  */
                 setInitCompleteFlag:function($control, initName){
                	 $control.data(initName + this.initNameSuffix, true);
                	 $control.attr("data-loaded", true);
                 },
                 
                 /**
                  * 移除初始化标志
                  */
                 removeInitCompleteFlag:function($control, initName){
                 	$control.removeData(initName + this.initNameSuffix);
                 	$control.removeAttr("data-loaded");
                 },
                 
                 /**
                  * 观察加载情况,当指定的控件全部加载完成后,调用回调
                  */
                 observeLoad:function(noLoads, completeCallBack){
                	 var _this = this;
                	 var newNoLoads = [];
                	 for(var i = 0; i < noLoads.length; i++){
                		var $control = noLoads[i];
                		if(!($control.attr("data-loaded") && $control.attr("data-loaded") == "true")){
                			newNoLoads.push($control);
              		    } 
                	 }
                	 
                	 if(newNoLoads.length > 0){
                		 setTimeout(function(){
                			 _this.observeLoad(newNoLoads, completeCallBack);
                         }, 200);
                	 }else{
                		 completeCallBack();
                	 }
                 }
            },
            
            /**
             * 注册指定范围对象(默认为$(document.body))下的控件加载完成的监听.
             * 
             * 注:
             *    <1>当通过html标签初始化的时候已在元素中指定class,调用此法可放置页面任意位置且在$(function(){})之中
             *       如:html页面内容   <span id="bigselect" class="sinboest-bigselect"></span>
             *       
             *    <2>当通过js初始化赋值class的时候,调用此方法需要至于页面的最后且在$(function(){})之中   
             *       如:html页面内容   <span id="bigselect"></span>
             * 
             * completeCallBack：加载完成的回调
             * config:配置信息
             *   -$range:指定范围下的控件,jquery对象.默认为$(document.body)
             *   -findClasses:查找控件的class样式,数组对象.默认为 $.sbbase.plugins
             */
            registerLoadCompleteListener:function(completeCallBack,config){
            	var $range = $(document.body);
            	var findClasses = $.sbbase.plugins;
            	
            	var isConfigFindClasses = false;
            	if(config){
            		if(config.findClasses){
            			findClasses = config.findClasses;
            			isConfigFindClasses = true;
                	}
                	if(config.$range){
                		$range = config.$range;
                	}
            	}
            	 
            	var noLoads = [];
            	for(var i = 0; i < findClasses.length; i++){
            		var name = findClasses[i];
            		var findClass = isConfigFindClasses ? name : $.sbbase.pluginClassPrefix + name;
            		var $controls = $range.find("." + findClass);
            		$controls.each(function(index, element){
                		noLoads.push($(element));
                	});
            	}
       
                this.initController.observeLoad(noLoads, completeCallBack);
            },
            
            /**
             * 是否存在伪协议黑名单中
             * 注：本方法实际提供了两种职责,检查和抛出异常.本应该分开,现在为程序调用方便放到一起
             * @param checked 被检查的字符串
             * @param isThrowEror 是否抛出错误
             */
            isInPseudoProtocolBlackList:function(checked, isThrowError){
            	if(this.isBlank(checked)){
            		return false;
            	}
            	
            	if($.isArray(checked)){
            		return false;
            	}
           	
            	if(typeof checked.toLocaleLowerCase !== "function"){
            		return false;
            	}
            	
            	var lowerCaseTrimChecked = checked.toLocaleLowerCase().replace(/\s+/g,"");
            	if(lowerCaseTrimChecked.indexOf("javascript") == 0 
            			|| lowerCaseTrimChecked.indexOf("vbscript") == 0 
            			|| lowerCaseTrimChecked.indexOf("data") == 0){
            		if(isThrowError){
            			throw new Error(checked + ":是不合法的参数配置!");
            		}
            		return true;
            	}
            	return false;
            }
    });
    
})(jQuery);/**
 * Sinobest-Tree:树控件
 * 
 * Dependency:jquery.ztree.all-3.5.js,jquery.ztree.exhide-3.5.js,sinobest.tools.js,sinobest-treetools.js
 */
(function ($) {
	
    var defaults = {   
        id:null,
   	    name:null,
   	    rows:6,
   	    cols:20,
   	    colModel:null,
   	    value:null,
   	    rootId:"-1",
   	    async:false,
   	    url:null,
   	    otherRequestParam:null,
        asyncLevelLoadUrl:null,
        asyncQueryUrl:null,
        asyncQueryParentNodesUrl:null,
        asyncInitDepth:1,
        labelDelimiter:";",
        labelNodeDelimiter:":",
        isShowParentNodeInLabel:false,
        selectTreeWidth:null,
        selectTreeHeight:null,
        type:"single",
        style:null,
        className:"sinobest-tree",
        required:false,
        readonly:false,
        disabled:false,
        expandAll:false,
        onConfirm:null,
        onClear:null,
        callback: null,
        onChange:null,
        saveType:"c",
        delimiter:null,
        onAjaxRequest: null, 
	    onAjaxResponse: null,
	    resize:false,
	    preventDuplicateQuery:true,
	    selectBranchMode:false,         //选择树枝模式
	    onQueryAjaxRequest:null,
	    onQueryAjaxResponse:null,
	    onInitComplete:null,
	    enableQuery:true
    };

    $.fn.sbtree = function (options) {
    	var settings;
        var $sbtree = this;
        if (isContain()) {
            if (options) {
                if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }
        $sbtree.settings = settings;
    
        function getter() {
            return $sbtree.data("$sbtree");
        }

        function setter() {
        	$sbtree.data("$sbtree", $sbtree);
        }

        function isContain() {
            return $sbtree.data("$sbtree");
        }
        
        $.sbbase.mixinWidget($sbtree);
        
        /**
         * 获取树控件的值
         */
        $sbtree.getValue = function(){
        	return getSelectedValues($sbtree.settings.saveType);
        };
        
        function getSelectedValues(type){
        	var value = "";
        	if(type == "c"){
        	    value = $sbtree._$hiddenValueControl.val();
        	}else{
        		value = $sbtree._$hiddenValueControl.data("detail");
        	}
        	
            if($.sbtools.isNotBlank(value)){
    			var values = value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER);
    			if($sbtree.settings.delimiter){
        			return values.join($sbtree.settings.delimiter);
            	}else{
            		if($sbtree.settings.type == "single"){
            			return values.length > 0 ? values[0] : "";
            		}
            		return values;
            	}
    		}
            return value;
        }
        
        $sbtree.getLabel = function(){
        	if($sbtree.settings.isShowParentNodeInLabel){
        		var labelValue = $sbtree._$labelControl.val();
                if($.sbtools.isBlank(labelValue)){
                	return "";
                }else{
                	var labelValues = labelValue.split($sbtree.settings.labelDelimiter);
                	if($sbtree.settings.delimiter){
            			return labelValues.join($sbtree.settings.delimiter);
                	}else{
                		if($sbtree.settings.type == "single"){
                			return labelValues.length > 0 ? labelValues[0] : "";
                		}
                		return labelValues;
                	}
                }
        	}else{
        		return getSelectedValues("d");
        	}
        };
        
        /**
         * 设置树控件的值
         */
        $sbtree.setValue = function(value){
        	Tree.controller.setValue(value);
        };
        
        function doSetValue(value, completeCallBack){
        	Tree.controller.setValue(value, completeCallBack);
        };
        
        /**
         * 设置树控件的状态
         */
        $sbtree.setState = function(stateJson){
            $.each(stateJson, function (k, v) {
                if (v !== undefined && v !== null) {
                    if (k == 'value') {
                    	$sbtree.setValue(v);
                    } else {
                        if (k == 'required') {
                        	$sbtree.settings.required = v;
                        	$sbtree._$labelControl.attr("required", v);
                        } else if (k == 'disabled') {
                        	$sbtree.settings.disabled = v;
                        	$sbtree._$labelControl.attr("disabled", v);
                        	$.sbtools.toggleInputDisabledClass($sbtree._$labelControl, v);
                        } else if(k == 'readonly'){
                        	$sbtree.settings.readonly = v;
                        	$.sbtools.toggleTextareaReadonlyClass($sbtree._$labelControl, v);
                        } else{
                        	 $sbtree.attr(k, v);
                        }
                    }
                } else {
                	$sbtree.removeAttr(k);
                }
            });
            return $sbtree;
        };
		
        $sbtree.getDefaultOptions = function(){
        	return defaults;
        };
        
        /**
         * 重新装载树控件,将树重新构建
         */
        $sbtree.reload = function(){
        	//因为将容器追加到body中,所以此处需要通过调用将容器从body中移除
            $sbtree._$sbtreeContainer.remove();
        	$sbtree.empty();
        	$.sbtools.initController.removeInitCompleteFlag($sbtree, "$sbtree");
        	render();
        };
        
        $sbtree.load = function(dataSource){
        	if($.sbtools.isNonNull(dataSource)){
        		$.sbtools.isInPseudoProtocolBlackList(dataSource, true);
        		$sbtree.settings.url = dataSource;
        		$sbtree.reload();
       	    }else{
       	    	throw new Error("Please set the correct data source");
       	    }
        };
        
        /**
         * 清除方法，将树控件从DOM结构中删除
         */
        $sbtree.destroy = function(){
        	$sbtree._$sbtreeContainer.remove();
        	return $sbtree.remove();
        };
        
        /**
         * 验证函数
         */
        $sbtree.validate = function () {
            if ($.isFunction($sbtree.settings.callback)) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                if ($sbtree.settings.required) {
                    var isOk = $.sbvalidator.required($sbtree._$hiddenValueControl[0], $sbtree.getValue());
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };
        
        /**
         * 获取控件的name
         */
        $sbtree.getName = function(){
        	return $sbtree.settings.name;
        };
        
        $sbtree.getSelectItems = function(){
        	var selectNodes = $sbtree._getSelectedTree().getCheckedNodes(true);
        	if(selectNodes === undefined || selectNodes === null || selectNodes.length <= 0){
        		return [];
        	}
        		
        	var selectItems = [];
        	for(var i = 0; i < selectNodes.length; i++){
        		   var treeNode = selectNodes[i];
        		   if(isAddToSelectedValue(treeNode)){
        			    //id,name,pId是三个基本核心的值,暂未提取公共变量
        			    var selectItem = Tree.controller.addMulColumnValue(treeNode, {
           				  "id" : treeNode.id,
           				  "name" : treeNode.name,
           				  "pId" : treeNode.pId
           		        });
           		        selectItem = Tree.controller.addDataFieldsColumnValue(treeNode, selectItem);
           		        selectItems.push(selectItem);
        		   }
        	}
        	return selectItems;
        };
        
        function initComplete(){
        	 $.sbtools.initController.initComplete($sbtree, "$sbtree", function(){
                 if(!isContain()){
                     setter();
                 }
             }, $sbtree.settings.onInitComplete);
        }
        
        /**
         * 分割器对象
         */
        var Splitter = function(){
        	this.$container = $('<div class="sinobest-tree-splitter-handler"></div>');
        	
        	var $handlerButtons = $('<div class="sinobest-tree-splitter-handler-buttons"></div>');
        	var $leftHandler = $('<a  class="sinobest-tree-splitter-pane1-button"></a>');
        	var $rightHandler = $('<a class="sinobest-tree-splitter-pane2-button"></a>');
        	
        	$handlerButtons.append($leftHandler).append($rightHandler);
        	this.$container.append($handlerButtons);

        	this.$container._leftHandler = $leftHandler;
        	this.$container._rightHandler = $rightHandler;
        };
        
        Splitter.prototype = {
        	getSplitterContainer : function(){
        			return this.$container;
        	},
        	initSplitterPanel: function($leftPanel, $rightPanel){
        		var _this = this;
                _this.$leftPanel = $leftPanel;
                _this.$rightPanel = $rightPanel;
                
            	//0表示处于中间状态[left,right]  1:表示在最左边[right]   2:表示在最右边[left]
            	var status = 0;
            	this.$container._leftHandler.bind("click", function(){
    				 if(status == 0){
                         _this._setInitWidth();
                      
                         var leftWidth = _this.$leftPanel.width() || 0;;
    					 var rightWidth = _this.$rightPanel.width() || 0;
    					 
    					 _this.$leftPanel.animate({width: 'toggle'});
    					 _this.$rightPanel.animate({width: leftWidth + rightWidth});
    					 
    					 $(this).hide();
    					 status = 1;
    				 }else{
    				     _this.$leftPanel.width(_this.$leftPanel.attr("data-sbwidth"));
    				     _this.$rightPanel.animate({width: 'toggle'});
    				     
    					 _this.$container._rightHandler.show();
    					 status = 0;
    				 }
    				
            	});
            	
            	this.$container._rightHandler.bind("click", function(){
            		 if(status == 0){
            			 _this._setInitWidth();
    					
    					 var leftWidth =  _this.$leftPanel.width()  || 0;
    					 var rightWidth = _this.$rightPanel.width() || 0;
    					 _this.$leftPanel.animate({width: leftWidth + rightWidth});
    					 _this.$rightPanel.animate({width: 'toggle'});
    					 
    					 $(this).hide();
    					 status = 2;
            		 }else{
            			 _this.$leftPanel.animate({width: 'toggle'});
    					 _this.$rightPanel.animate({width: _this.$rightPanel.attr("data-sbwidth")});
    					 
    					 _this.$container._leftHandler.show();
    					 status = 0;
    				 } 
           	    });
            
        	},
        	
        	_setInitWidth: function(){
        		 var leftWidth  = this.$leftPanel.width() || 0;
				 var leftInitWidth = this.$rightPanel.attr("data-sbwidth");
				 if(leftInitWidth){
					 this.$leftPanel.attr("data-sbwidth", leftInitWidth);
				 }else{
					 this.$leftPanel.attr("data-sbwidth", leftWidth);
				 }
				 
				 var rightWidth = this.$rightPanel.width() || 0;
				 var rightInitWidth =   this.$rightPanel.attr("data-sbwidth");
				 if(rightInitWidth){
					 this.$rightPanel.attr("data-sbwidth", rightInitWidth);
				 }else{
					 this.$rightPanel.attr("data-sbwidth", rightWidth);
				 }
        	}
        	
        };
        
        
        /**
         * Init
         */
        function render() {
        	if($sbtree.settings.id === null){
        		$sbtree.settings.id = $sbtree.attr("id") + "_tree";
        	}
        	
        	$sbtree.addClass($sbtree.settings.className);
        	$sbtree.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
        	
        	renderLabelArea();
        	renderHiddenValueArea();
        	renderTreeContainerArea();
        	renderSize();
        	
        	buildTree();
        	
        	setter();
            return $sbtree;
        }
        
        /**
         * 渲染标签区域
         */
        function renderLabelArea(){
        	 var $textarea = $('<textarea readonly></textarea>');
        	 
        	 if($sbtree.settings.id) {
        		 $textarea.attr("id", $sbtree.settings.id);
        	 }
        	 if($sbtree.settings.name){
        		 $textarea.attr("name", $sbtree.settings.name);
        	 }
        	 $textarea.attr("rows", $sbtree.settings.rows);
        	 $textarea.attr("cols", $sbtree.settings.cols);
        	 if($sbtree.settings.style){
        		 $textarea.attr("style", $sbtree.settings.style);
        	 }
        	
        	 $textarea.attr("disabled", $sbtree.settings.disabled);
        	 $.sbtools.toggleInputDisabledClass($textarea, $sbtree.settings.disabled);
        	 
        	 if($sbtree.settings.resize){
             	$textarea.css('resize', 'both');
             }else{
             	$textarea.css('resize', 'none');
             } 
        	 
        	 //textarea默认就是readonly,当readonly时，增加样式来控制
        	 $.sbtools.toggleTextareaReadonlyClass($textarea, $sbtree.settings.readonly);
        	 
        	 $sbtree.append($textarea);
        	 $sbtree._$labelControl = $textarea;
        }
        
        /**
         * 渲染隐藏的值区域
         */
        function renderHiddenValueArea(){
        	var $hiddenValue = $('<input type="hidden"></input>');
        	$sbtree.append($hiddenValue);
        	$sbtree._$hiddenValueControl = $hiddenValue;
        }
        
        /**
         * 渲染树容器
         */
        function renderTreeContainerArea(){
        	//树容器
        	var $sbtreeContainer = $('<div class="sinobest-tree-container sinob-widget-container"></div>');
        	
        	//#1 查询区域
        	var $sbtreeQueryContainer = "";
        	var $queryInput = "";
        	var $queryBtn  = "";
        	if($sbtree.settings.enableQuery){
        		$sbtreeQueryContainer = $('<div class="sinobest-tree-query"></div>');
            	$queryInput = $('<input type="text" class="sinobest-text-query sinobest-tree-query-text"></input>'); 
            	$queryBtn = $('<input type="button" value="查询" class="sinobest-button-common sinobest-tree-query-btn"></input>');
            	$sbtreeQueryContainer.append($queryInput).append($queryBtn);
        	}
        	
        	//# 选择区域
        	var $sbtreeSelectContainer = $('<div class="sinobest-tree-select-container"></div>');
        	
        	//#2 可选树区域
        	var $sbtreeSelectableContainer = $('<div class="sinobest-tree-selectable"></div>');
        	//$sbtreeSelectableContainer.append('<div class="sinobest-tree-selectable-title">可选：</div>');
        	var $selectableTree = $('<div class="ztree sinobest-tree-selectable-ztree"></div>');
            $selectableTree.attr("id", $sbtree.settings.id + "_selectable");
        	$sbtreeSelectableContainer.append($selectableTree);

        	//#3splitter区域
        	//var splitter = null;
        	
            //#4已选树区域
        	var $sbtreeSelectedContainer = $('<div class="sinobest-tree-selected"></div>');
        	//$sbtreeSelectedContainer.append('<div class="sinobest-tree-selected-title">已选：</div>');
        	var $selectedTree = $('<div class="ztree sinobest-tree-selected-ztree"></div>');	
        	$selectedTree.attr("id", $sbtree.settings.id + "_selected");
        	$sbtreeSelectedContainer.append($selectedTree);
        	if(isSingle()){
        		$sbtreeSelectedContainer.hide();
        		$selectableTree.addClass("sinobest-tree-selectable-ztree-simple-single");
        	}
        	
        	//组装选择区域
        	$sbtreeSelectContainer.append($sbtreeSelectableContainer);
        	//单选不存在已选区域
        	/*if(!isSingle()){
        		splitter = new Splitter();
            	$sbtreeSelectContainer.append(splitter.getSplitterContainer());
        	}*/
        	$sbtreeSelectContainer.append($sbtreeSelectedContainer);
        	
        	//#5按钮区域
        	var $sbtreeBtnContainer = $('<div class="sinobest-tree-btns"></div>');
        	var $confirmBtn = $('<input type="button" value="确定" class="sinobest-button-common sinobest-tree-btns-confirmbtn"></input>');	
        	var $clearBtn = $('<input type="button"   value="清空" class="sinobest-button-common sinobest-tree-btns-clearbtn"></input>');
        	$sbtreeBtnContainer.append($confirmBtn).append($clearBtn);

        	//#6组装树容器
        	$sbtreeContainer.append($sbtreeQueryContainer).append($sbtreeSelectContainer).append($sbtreeBtnContainer);
        	//$sbtree.append($sbtreeContainer);
        	if($sbtree.attr("id")){
        		$sbtreeContainer.attr("id", $sbtree.attr("id") + "_tree_container");
			}else{
				if($sbtree.settings.id){
					 $sbtreeContainer.attr("id", $sbtree.settings.id + "_tree_container");
				}
			}
			$(document.body).append($sbtreeContainer);
        	
        	$sbtree._$sbtreeContainer = $sbtreeContainer;
        	if($sbtree.settings.enableQuery){
        		$sbtree._$queryInput = $queryInput;
            	$sbtree._$queryBtn = $queryBtn;
        	}
        	$sbtree._$selectableTree = $selectableTree;
        	$sbtree._$selectedTree = $selectedTree;
        	$sbtree._$confirmBtn = $confirmBtn;
        	$sbtree._$clearBtn = $clearBtn;
        	
        	/*if(!isSingle()){
        		//初始化分割容器
            	splitter.initSplitterPanel($sbtree._$selectableTree, $sbtree._$selectedTree);
        	}*/
        }

        function renderSize(){
        	if($sbtree.settings.selectTreeWidth){
        		$sbtree._$selectableTree.width($sbtree.settings.selectTreeWidth);
        		$sbtree._$selectedTree.width($sbtree.settings.selectTreeWidth);
            }	
            if($sbtree.settings.selectTreeHeight){
            	$sbtree._$selectableTree.height($sbtree.settings.selectTreeHeight);
        		$sbtree._$selectedTree.height($sbtree.settings.selectTreeHeight);
            }
        }
        
        function buildTree(){
    	    buildLabel();
    	    buildHiddenValue();
    	    buildTreeContainer();
        }
        
        /**
         * 构建标签控件
         */
        function buildLabel(){
        	$sbtree._$labelControl.bind("click", function(){
        		if($sbtree._$sbtreeContainer.is(":visible")){
        			return;
        		}
        		
        		if ($sbtree.settings.readonly) {
					return;
				}
        		
        		$.sbtools.adjustInputPopupDropdownContainerPosition($sbtree._$labelControl, $sbtree._$sbtreeContainer);
    	    	$("html").bind("mousedown", sinobestTreeOnBodyDown);
    	    });
        	
        	//设置显示值
        	$sbtree._$labelControl.setValue = function(value){
        		if(typeof value.id === undefined || value === ""){
        			this.val("");
        			this.attr("title", "");
        			return;
        		}
        		
        		if(value.id.length > 0){
        			this.val(value.name);
            		this.attr("title", value.name);
        		}else{
        			this.val("");
        			this.attr("title", "");
        		}
        	};
        }
        
        /**
		 * 隐藏树容器
		 */
		function hideTreeContainer() {
			$sbtree._$sbtreeContainer.fadeOut("fast");
			$("html").unbind("mousedown", sinobestTreeOnBodyDown);
		}
		
		function sinobestTreeOnBodyDown(event){
			if (!(event.target.id == $sbtree._$labelControl.attr("id")
					 || $(event.target).hasClass("sinobest-tree-container")
					 || $(event.target).parents("div.sinobest-tree-container").length > 0)) {
				hideTreeContainer();
		    }
		}
		
		/**
		 * 构建隐藏的值控件
		 */
		function buildHiddenValue(){
			$sbtree._$hiddenValueControl.setValue = function(value){
				if(typeof value.id === undefined || value === ""){
					this.val("");
					this.data("detail", "");
					return;
				}
				
				if (value.id.length > 0){
	    			this.val(value.id);
	    		}else{
	    			this.val("");
	    		}
				
				if(value.detail.length > 0){
					this.data("detail", value.detail);
				}else{
					this.data("detail", "");
				}
				
			};
			
		}
		
		 var Tree = {};
		
		/**
		 * 构建树容器
		 */
		function buildTreeContainer(){
			/**
			 * 获取可选树
			 */
			$sbtree._getSelectableTree = function(){
				 return $.fn.zTree.getZTreeObj($sbtree._$selectableTree.attr("id"));
			};
			
			/**
			 * 获取已选树
			 */
			$sbtree._getSelectedTree = function(){
				return $.fn.zTree.getZTreeObj($sbtree._$selectedTree.attr("id"));
			};
			
			$sbtree._$confirmBtn.bind("click", function(){
				var oldValue = $sbtree.getValue();
				setLabelAndHiddenValueControlFromSelectedValue();
	   
          		//调用回调函数
          		var onConfirm = $sbtree.settings.onConfirm;
          		if(onConfirm){
          			//使用toString()方法是因为getValue值可能为数组,不能直接用==比较
          			var isChange = (oldValue.toString() !=  $sbtree.getValue().toString());
          			onConfirm.apply(window, [$sbtree.getSelectItems(), isChange]);
          		}
          	
          		hideTreeContainer();
      	    });
			
			$sbtree._$clearBtn.bind("click", function(){
				var selectableTree = $sbtree._getSelectableTree(); 
			    var selectedTree = $sbtree._getSelectedTree();
			    
	    		var clearNodes = selectedTree.getCheckedNodes(true);
	    		for(var i = 0; i < clearNodes.length; i++){
	    			var node = selectableTree.getNodeByParam("id", clearNodes[i].id);
	    			if(node !== null){
	    				node.checked = false;
	        			selectableTree.updateNode(node);
	    			}
	    			selectedTree.removeNode(clearNodes[i], true);
	    		}
	    		
	    		if(isSingle()){
	    			$.sbtreetools.removeAllNodes(selectedTree);
	    		}
	    		
	    		var onClear = $sbtree.settings.onClear;
	    		if(onClear){
	    			var args = [];
	    			args.push({});
	    			onClear.apply(window, args);
	    		}
	    	
   	        });	
			
			//创建树
			Tree.controller.createTree();
		}
		
		/**
    	 * 设置标签控件和隐藏值控件的值
    	 */
    	function setLabelAndHiddenValueControlFromSelectedValue(){
    		var selectedTreeValue = getSelectedTreeValue();
    		$sbtree._$labelControl.setValue(selectedTreeValue);
            $sbtree._$hiddenValueControl.setValue(selectedTreeValue);
    	}
    	
    	function clearLabelAndHiddenValue(){
    		$sbtree._$labelControl.setValue("");
            $sbtree._$hiddenValueControl.setValue("");
    	}
    	
    	/**
    	 * 是否单选
    	 */
    	function isSingle(){
    		if($sbtree.settings.type == 'single'){
    			return true;
    		}
    		return false;
    	}
    	
    	/**
    	 * 获取树选中的值
    	 * 返回值：{id:树节点ID,以;号隔开,  name:显示的名称, detial:树节点NAME,以;隔开}
    	 */
    	function getSelectedTreeValue(){
        	var nodes = $sbtree._getSelectedTree().getCheckedNodes(true);
    
        	var id = "";     //node的id
        	var name = "";   //label显示的名称
        	var detail = ""; //node的name
    		for (var i=0, l=nodes.length; i<l; i++) {
    			var node = nodes[i];
    			if(isAddToSelectedValue(node)){
    				id += node.id + $.sbtools.CONSTANTS.DEFAULT_DELIMITER;
    				detail += node.name + $.sbtools.CONSTANTS.DEFAULT_DELIMITER;
    				if($sbtree.settings.isShowParentNodeInLabel){
    					name += $.sbtreetools.getNodeNameAppendParentsName(node, $sbtree.settings.labelNodeDelimiter) + $sbtree.settings.labelDelimiter;
    				}else{
    					name += node.name + $sbtree.settings.labelDelimiter;
    				}
    			}
    		}
    		
    		if (id.length > 0 ){
    			id = id.substring(0, id.length - 1);
    		}
    		
    		if (detail.length > 0 ){
    			detail = detail.substring(0, detail.length - 1);
    		}
    		
    		if(name.length > 0){
    			name = name.substring(0, name.length -1) ;
    		}
    		
    		return {"id":id, "name":name, "detail":detail};
    	}
    	
    	/**
    	 * 是否能增加到已选的值中
    	 */
    	function isAddToSelectedValue(treeNode){
    		if(isSelectBranchMode()){
    			//叶子节点可增加
    			if(!(treeNode.isParent)){
    				return true;
    			}
    		 
    			//树枝节点不能包含子节点才可增加
    			if(treeNode.isParent && (treeNode.children === undefined || treeNode.children.length <= 0)){
    				return true;
    			}
    			return false;
    		}else{
    			//只有叶子节点可增加
    			return !(treeNode.isParent);
    		}
    	}
    	
    	/**
    	 * 树枝可选模式
    	 */
    	function isSelectBranchMode(){
    		if($sbtree.settings.selectBranchMode){
    			return true;
    		}
    		return false;
    	}
    	
    	/**
    	 * 是否有多列
    	 */
    	function hasColModel(){
    		if($sbtree.settings.colModel !== null && $sbtree.settings.colModel.length > 0){
    			return true;
    		}
    		return false;
    	}
    	
    	/**
    	 * 基础的默认配置
    	 */
    	Tree.defaultSetting = {
    		check : {
    			enable : true
    		},
    		view : {
    			dblClickExpand : false
    		},
    		data : {
    			simpleData : {
    				enable : true
    			}
    		}
    	};
    	
    	/**
    	 * 选择树枝模式的特有的配置
    	 */
    	Tree.mulSelectBranchModeSetting = {
    		check :{
    			chkboxType:{ "Y" : "p", "N" : "s" }
    		}
    	};

    	/**
    	 * 单选的配置
    	 */
    	Tree.singleSetting = {
    		check : {
    			enable : true,
    			chkStyle : "radio",
    			radioType : "all"
    		}
    	};
    	
    	/**
    	 * 将ztree中原始的树节点转换为普通的树节点,此节点不包含ztree赋值的特殊属性.
    	 * 如果配置多列,则会将多列的值也添加到树节点中
    	 * 
    	 * @param treeNodes ztree的树节点数据
    	 * @param defaultValue 默认的树节点的值,JSON对象
    	 */
    	Tree.transformToSimpleTreeNodes = function(treeNodes, defaultValue){
    		if(treeNodes === undefined || treeNodes === null || treeNodes.length <= 0){
    			return [];
    		}
    		
    		var simpleTreeNodes = [];
    		for(var i = 0; i < treeNodes.length; i++){
    			var treeNode = treeNodes[i];
    			var simpleTreeNode = Tree.controller.addMulColumnValue(treeNode, {
    				"id" : treeNode.id,
    				"name" : treeNode.name,
    				"pId" : treeNode.pId,
    				"isParent":treeNode.isParent,
    				"checked":treeNode.checked,
    				"chkDisabled":treeNode.chkDisabled,
    				"nocheck":treeNode.nocheck
    			});
    			if(defaultValue !== undefined && defaultValue !== null){
    				$.extend(simpleTreeNode, defaultValue);
    			}
    			
    			simpleTreeNode = Tree.controller.addDataFieldsColumnValue(treeNode, simpleTreeNode);
    			
    			simpleTreeNodes.push(simpleTreeNode);
    		}
    		return simpleTreeNodes;
    	};
    	
    	Tree.transformToSimpleTreeNode = function(treeNode, defaultValue){
    		if(treeNode === undefined || treeNode === null){
    			return null;
    		}
    		return this.transformToSimpleTreeNodes([treeNode], defaultValue)[0];
    	};

    	/**
    	 * 树控制器
    	 */
    	Tree.controller = {
    		createTree: function(){
    			$sbtree.isInitTreeBuilded = false;
    			if ($sbtree.settings.async) {
    				this.lazyController.createTree();
    			} else {
    				this.allController.createTree();
    			}
    		},
    		
    		/**
    		 * 创建初始化的树配置
    		 */
    		createInitTreeConfig : function(){
      		   var initConfig = {};
      		   if(isSingle()){
      			   initConfig.check = Tree.singleSetting.check;
      		   }
      		   return initConfig;
      	    },
      	   
      	    /**
      	     * 组装完成树的配置
      	     */
      	    assembleFinishTreeConfig : function(treeConfig){
      	       //#1增加多列初始化配置信息
               if(hasColModel()){
   				   $.sbtreetools.mulColumnController.addMulColumnConfig(treeConfig, $sbtree.settings.colModel);
   			   }
   			
               //#2
      		   if(isSelectBranchMode()){
      			   if(isSingle()){
      				  return $.extend({},Tree.defaultSetting, treeConfig);
      			   }else{
      				  return $.extend(true, {}, Tree.defaultSetting, treeConfig, Tree.mulSelectBranchModeSetting);
      			   }
      		   }else{
      			   return $.extend({},Tree.defaultSetting, treeConfig);
      		   }
      	   },
    		
    		setValue : function(value, completeCallBack){
    			clearLabelAndHiddenValue();
    			
    			if ($sbtree.settings.async) {
    				this.lazyController.setValue(value, completeCallBack);
    			} else {
    				this.allController.setValue(value,completeCallBack);
    			}
    		},
    		
    		clearSelectTree: function(){
    			//#1.清空已选择树
    			var selectedTree = $sbtree._getSelectedTree();
    			$.sbtreetools.removeAllNodes(selectedTree);
    			 
    			//#2.清空可选树选中的选中的
    		    var selectableTree = $sbtree._getSelectableTree();
    		    var checkedNodes = selectableTree.getCheckedNodes();
    		    for(var checkedIndex = 0, checkedLength = checkedNodes.length; checkedIndex < checkedLength; checkedIndex++){
    		    	selectableTree.checkNode(checkedNodes[checkedIndex], false, false, false);
    		    }
    		},
    		
    		callback:{
    		   onChangeCallBack:function(e, treeId, treeNode){
    			   if(typeof $sbtree.settings.onChange == "function"){
    				   $sbtree.settings.onChange(e, treeId, treeNode);
    			   }
    		   }
    		},
    		
    		/**
    		 * 转换值为字符串值，当是字符串数组时，返回的字符串以;号相连 <p>
    		 * value的类型可为字符串或者字符串数组
    		 */
    		convertValueToStr:function(value){
    			if($.sbtools.isBlank(value)){
    				return "";
    			}
    			
    			if(typeof value === 'string'){
    				return value;
    			}
    			
    			if($.isArray(value)){
    				return value.join($.sbtools.CONSTANTS.DEFAULT_DELIMITER);
    			}
    			
    			return "";
    		},
    		
    		/**
    		 * 转换值到数组 <p>
    		 * value的类型可为字符串或字符串数组
    		 */
    		convertValueToArray:function(value){
    			if($.sbtools.isBlank(value)){
    				return [];
    			}
    			
    			if(typeof value === 'string'){
    				if(value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER).length > 0){
    					return value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER);
    				}else{
    					var values = [];
        				values.push(value);
        				return values;
    				}
    			}
    			
    			if($.isArray(value)){
    				return value;
    			}
    			
    			return [];
    		},
    		
    		/**
    		 * 修改节点的nocheck属性,当存在多列显示时，需要处理多列的nocheck
    		 */
    		updateMulColNocheck : function(treeNode){
    			if(hasColModel()){
    				$.sbtreetools.mulColumnController.processMulColNocheck(treeNode);
    			}
    		},
    		
    		/**
    		 * 增加多列的值
    		 */
    		addMulColumnValue : function(treeNode, originalValue){
    			if(hasColModel()){
    				return $.sbtreetools.mulColumnController.addMulColumnValue(treeNode, originalValue, $sbtree.settings.colModel);
    			}
    			return originalValue;
    		},
    		
    		/**
    		 * 处理单选模式下树节点是否有radio或checkbox
    		 */
    		processSingleTreeNodeNoCheck : function(tree){
    			//选择树枝模式不需要设置nocheck
    			if(isSelectBranchMode()){
					return;
				}
    			this.setParentNodesNoCheck(tree);
    		},
    		
    		/**
    		 * 设置树所有父节点隐藏checkbox/radio
    		 */
    		setParentNodesNoCheck: function(tree){
    			 var _this = this;
    			 if(hasColModel()){
    				 $.sbtreetools.setParentNodesNoCheck(tree, function(callBackTreeNode){
    					 _this.updateMulColNocheck(callBackTreeNode);
   	                 });
    			 }else{
    				 $.sbtreetools.setParentNodesNoCheck(tree);
    			 }
    		},
    		
    		/**
    		 * 当前节点为父节点，则设置其隐藏checkbox/radio,同时设置其所有子节点中是父节点的树节点也隐藏
    		 */
    		setNoCheckIfIsParentNode: function(tree, treeNode){
    			var _this = this;
    			if(hasColModel()){
    				$.sbtreetools.setNoCheckIfIsParentNode(tree, treeNode, function(callBackTreeNode){
    					_this.updateMulColNocheck(callBackTreeNode);
    				});
   			    }else{
   			    	$.sbtreetools.setNoCheckIfIsParentNode(tree, treeNode);
   			    }
    		},
    		
    		/**
    		 * 初始化响应时的数据字段
    		 */
    		initDataFields:function(datas){
    			$sbtree.dataFields = [];
            	if(datas["treeNodes"].length > 0){
            		var firstDataItem = datas["treeNodes"][0];
            		for(var itemField in firstDataItem){
            			$sbtree.dataFields.push(itemField);
            		}
            	}
    		},
    		
    	    /**
    	     * 增加数据字段的值到原始对象中
    	     */
    		addDataFieldsColumnValue : function(treeNode, originalValue){
    			if($sbtree.dataFields === undefined || $sbtree.dataFields === null || $sbtree.dataFields.length <= 0){
    				return originalValue;
    			}
    			
    			for(var i = 0, length = $sbtree.dataFields.length; i < length; i++){
    				var dataField = $sbtree.dataFields[i];
    				if(originalValue.hasOwnProperty(dataField)){
    					continue;
    				}
    				originalValue[dataField] = treeNode[dataField];
    			}
    			return originalValue;
    		}
    	};
    	
    	/**
    	 * 完全加载控制器
    	 */
    	Tree.controller.allController = {
    	   createTree: function(){
    		   var selectableConfig = this.createSelectableTreeConfig();
    		   var selectedConfig = this.createSelectedTreeConfig();
    		   if($sbtree.settings.enableQuery){
    			   this.bindQueryBtnEvent();
    		   }
    		   this.initTree(selectableConfig, selectedConfig);
    	   },
    	   
    	   /**
    	    * 创建可选树的配置信息
    	    */
    	   createSelectableTreeConfig: function(){
    		   var selectableConfig = Tree.controller.createInitTreeConfig();
    		   
    		   selectableConfig.callback = {
    		      onCheck :function(e, treeId, treeNode) {
    		    	  Tree.selectableTreeOncheck(e, treeId, treeNode);
    		    	  Tree.controller.callback.onChangeCallBack(e, treeId, treeNode);
    		      },
    		      onExpand:function(event, treeId, treeNode){
    		    	  //查询中展开当前父节点的时候需要将其子节点(是父节点,且其子节点隐藏)的-号转换为+号
    		    	  if(treeNode.isParent && treeNode.children
    		    			  && treeNode.children.length > 0 && treeNode.children[0].isHidden){
    		    		  for(var i = 0, length = treeNode.children.length; i < length; i++){
    		    			  $sbtree._getSelectableTree().expandNode(treeNode.children[i], false, false, false, false);
    		    		  }
  		    	          $sbtree._getSelectableTree().showNodes(treeNode.children);
    		    	  }
    		      }
    		   };
    		   return  Tree.controller.assembleFinishTreeConfig(selectableConfig);
    	   },
    	   
    	   /**
    	    * 创建已选树的配置信息
    	    */
    	   createSelectedTreeConfig: function(){
    		   var selectedConfig = Tree.controller.createInitTreeConfig(); 
    		    
    		   selectedConfig.callback = {
    		    	onCheck :function(e, treeId, treeNode) { 
    		    		Tree.selectedTreeOncheck(e, treeId, treeNode);
    		    	}
    		   };
    		   return Tree.controller.assembleFinishTreeConfig(selectedConfig);
    	   },
    	   
    	   /**
    	    * 绑定查询按钮的事件
    	    */
    	   bindQueryBtnEvent: function(){
    		   $sbtree._$queryBtn.bind("click", function(){
    			      var query = $sbtree._$queryInput.val();
    			      
    			      if($sbtree.settings.preventDuplicateQuery){
    			    	  if($sbtree._$queryInput.lastQuery === query){
        			    	  return;
        			      }
        			      $sbtree._$queryInput.lastQuery = query;
    			      }
    	 	    	  
    		    	  var selectableTree = $sbtree._getSelectableTree();
    		    	  if(query === ""){
    		    		  selectableTree.showNodes(selectableTree.getNodesByParam("isHidden", true));
    		    	  }else{
    		    		  //名称查询
    		    		  var nameQueryNodes = selectableTree.getNodesByParamFuzzy("name", query, null);
    		    		  //编码查询
    		    		  var codeQueryNodes = selectableTree.getNodesByParamFuzzy("id", query, null);
    		    		  
    		    		  selectableTree.hideNodes(selectableTree.getNodesByParam("isHidden", false));
    		    		  
    		    		  var queryAllNodes = [];
    		    		  var queryToParentNodes = [];   //查询到的父节点
    		    		  //#显示按名称查询的节点
    		    		  for(var i = 0, nameLength = nameQueryNodes.length; i < nameLength; i++){
    		    			    var nameQueryNode = nameQueryNodes[i];
    		    			    queryAllNodes.push(nameQueryNode);
    		    		    	var parentNode = nameQueryNode.getParentNode();
    		    		    	while(parentNode !== null){
    		    		    		queryAllNodes.push(parentNode);
    		    		    		parentNode = parentNode.getParentNode();
    		    		    	}
    		    		    	
    		    		    	if(nameQueryNode.isParent){
    		    		    		queryToParentNodes.push(nameQueryNode);
    		    		    	}
    		    		  }
    		    		  
    		    		  //#显示按id查询的节点
    		    		  for(var j = 0, codeLength = codeQueryNodes.length; j < codeLength; j++){
    		    			    var codeQueryNode = codeQueryNodes[j];
    		    			    queryAllNodes.push(codeQueryNode);
    		    		    	var codeParentNode = codeQueryNode.getParentNode();
    		    		    	while(codeParentNode !== null){
    		    		    		queryAllNodes.push(codeParentNode);
    		    		    		codeParentNode = codeParentNode.getParentNode();
    		    		    	}
    		    		    	
    		    		    	if(codeQueryNode.isParent){
    		    		    		queryToParentNodes.push(codeQueryNode);
    		    		    	}
    		    		  }
    		    		
    		    		  selectableTree.showNodes(queryAllNodes);
    		    		  selectableTree.expandAll(true);
    		    		  
    		    		  //#父节点存在子节点且子节点隐藏,需要将父节点的-号转换为+号,界面点击可以直接展开.对展开的子节点还需要结合onExpand方法实现.
    		    		  for(var index = 0, length = queryToParentNodes.length; index < length; index++){
    		    			  var queryToParentNode = queryToParentNodes[index];
    		    			  if(queryToParentNode.children && queryToParentNode.children.length > 0 
    		    					  && queryToParentNode.children[0].isHidden){
    		    				  //折叠当前父节点
    		    				  selectableTree.expandNode(queryToParentNode, false, false, false, false);
    		    			  }
    		    		  }
    		    	  }
    		    });
    	   },
    	   
    	   /**
    	    * 初始化创建树
    	    */
    	   initTree: function(selectableConfig, selectedConfig){
    		   var request = {};
    		   request.rootId = $sbtree.settings.rooId;
    		   request.saveType = $sbtree.settings.saveType;
    		   
    		   $.extend(request, $sbtree.settings.otherRequestParam || {});
    		   
    		   if($sbtree.settings.onAjaxRequest && $.isFunction($sbtree.settings.onAjaxRequest)){
    			   request = ($sbtree.settings.onAjaxRequest)(request);
		       }
    		   $.ajax({type:"post",
    	               contentType:"application/json; charset=utf-8",
    	               dataType:"json",
    	               data:JSON.stringify(request),
    	               url:$sbtree.settings.url,
    	               success:function (treeResponse) {
    	            	if($sbtree.settings.onAjaxResponse && $.isFunction($sbtree.settings.onAjaxResponse)){
    	            		treeResponse = ($sbtree.settings.onAjaxResponse)(treeResponse);
    	    		    }
                        
    	            	Tree.controller.initDataFields(treeResponse);
    	            	
    	    		    //初始化可选树
    	    		    $.fn.zTree.init($sbtree._$selectableTree, selectableConfig, treeResponse.treeNodes);
    	    		    
    	    		    //初始化已选树
    	    		    $.fn.zTree.init($sbtree._$selectedTree, selectedConfig, null);
    	    		    
    	    		    var selectableTree = $sbtree._getSelectableTree();
    	    		    //针对单选需要设置父节点无法选择
    	    			if(isSingle()){
    	    				Tree.controller.processSingleTreeNodeNoCheck(selectableTree);
    	    		    }
    		      
    	    			if($sbtree.settings.expandAll){
    	    				selectableTree.expandAll(true);
    	    			}
    	    			
    	    			$sbtree.isInitTreeBuilded = true;
		  		        if($sbtree.data("$tempSetValue")){
		  		        	$sbtree.settings.value = $sbtree.data("$tempSetValue");
		  		        	$sbtree.removeData("$tempSetValue");
                        } 
		  		        
    	    		    if($sbtree.settings.value){
		   		            doSetValue($sbtree.settings.value, function(){
		   		            	initComplete();
		   		            });
		   		        }else{
		   		        	initComplete();
		   		        }
    	            },
    	            error:function (XMLHttpRequest, textStatus, errorThrown) {
    	                var e = {};
    	                e.code = XMLHttpRequest.status;
    	                e.msg = $.sberror.format(e.code, this.url);
    	                $.sberror.onError(e);
    	            }
    	        });
    	   },
    	   
    	   /**
    	    * 对有初始化值的进行处理
    	    */
    	   processInitValue: function(value){
                if(value === undefined){
                	return;
                }
                
    		    var selectableTree = $sbtree._getSelectableTree();
    		    var values =  Tree.controller.convertValueToArray(value);
    		    
    		    var length = values.length;
    		    if(isSingle()){
    		    	length = values.length > 0 ? 1:0;
    		    }
    		    for(var i = 0; i < length; i++){
    		    	var initValue = values[i];
    		    		
    		    	var node;
    		    	if($sbtree.settings.saveType == "c"){
    		    		node = selectableTree.getNodeByParam("id", initValue);
    		    	}else{
    		    		node = selectableTree.getNodeByParam("name", initValue);
    		    	}
    		    	if(node !== undefined && node !== null){
    		    		//输入查询后,节点如果是隐藏,则不会触发checkNode事件.
    		    		var queryHideNodes = [];
    		    		if(node.isHidden){
    		    			queryHideNodes = queryHideNodes.concat($.sbtreetools.getParentNodes(node));
    		    			queryHideNodes.push(node);
    		    			selectableTree.showNodes(queryHideNodes);
    		    		}
    		    		
    		    		//调用此方法会触发可选树的onCheck回调方法,通过勾选可选树来自动勾选已选树的节点,依赖可选树的onCheck逻辑.
    		    		selectableTree.checkNode(node, true, true, true);
    		    		
    		    		//查询隐藏的节点保持原始隐藏状态
    		    		if(queryHideNodes.length > 0){
    		    			selectableTree.hideNodes(queryHideNodes);
    		    		}
    		    	}
    		    }
    		    	
    		    //展开已选节点
    		    var checkedNodes = selectableTree.getCheckedNodes();
    		    if(isSingle()){
    		    	if(checkedNodes !== null && checkedNodes.length == 1){
    		    		var parentNode = checkedNodes[0].getParentNode();
    		    		while(parentNode !== null){
    		    			selectableTree.expandNode(parentNode, true, false, true);
    		    			parentNode = parentNode.getParentNode();
    		    		}
    		    	}
    		    }else{
    				for(var checkedIndex = 0, checkedLength = checkedNodes.length; checkedIndex < checkedLength; checkedIndex++){
    					selectableTree.expandNode(checkedNodes[checkedIndex], true, false, true);
    				}
    		    }
    		
    		},
    		
    		/**
    		 * 设置值
    		 */
    		setValue: function(value, completeCallBack){
    			//设置值的时候需要考虑树是否已经初始化完成
    			if(!$sbtree.isInitTreeBuilded){
					$sbtree.data("$tempSetValue", value);
					return;
				}
    			Tree.controller.clearSelectTree();
    			$sbtree.settings.value = value;
    		    this.processInitValue(value);
    		    setLabelAndHiddenValueControlFromSelectedValue();
    		    
    		    if(completeCallBack && $.isFunction(completeCallBack)){
    		    	completeCallBack();
            	}
    		}
    	};
    	
    	/**
    	 * 懒加载
    	 */
    	Tree.controller.lazyController = {
    			createTree: function(){
    			     var selectableConfig = this.createSelectableTreeConfig();
    			     var selectedConfig = this.createSelectedTreeConfig();
    			     if($sbtree.settings.enableQuery){
    	    			   this.bindQueryBtnEvent();
    	    		 }
    			     this.initTree(selectableConfig, selectedConfig);
    		    },
    		    
    		    createSelectableTreeConfig: function(){
    		      	var selectableConfig = Tree.controller.createInitTreeConfig();
    		      	
    		      	var otherParam = $.extend({"rootId":$sbtree.settings.rootId, "initDepth" : $sbtree.settings.asyncInitDepth}, 
    		      			                   $sbtree.settings.otherRequestParam || {});
    		      	selectableConfig.async = {
    		      		enable: true,
    		      		contentType:"application/json; charset=utf-8",
    		      		type:"post",
    		  		    dataType : "json" ,
    		  		    url:$sbtree.settings.asyncLevelLoadUrl,
    		  		    autoParam:["id","name","level","onCheckLoad"],
    		  		    otherParam:otherParam,
    		  		    dataFilter:function(treeId, parentNode, responseData){
    		  		    	if(responseData){
    		  		    		return responseData.treeNodes;
    		  		    	}
    		  		    	return null;
    		  		    }
    		  	    };
    		      	
    		      	var _this = this;
    		   	    selectableConfig.callback = {
    		   	    	onCheck :function(e, treeId, treeNode) {
    		   	    		_this._selectableTreeOnCheck(e, treeId, treeNode);
    		   	    		Tree.controller.callback.onChangeCallBack(e, treeId, treeNode);
    		   	    	},
    		   	    	onAsyncSuccess: function(e, treeId, treeNode){
    		   	    		_this._selectableTreeOnAsyncSuccess(e, treeId, treeNode);
    		   	    	},
    		   	    	onAsyncError: function(event, treeId, treeNode, XMLHttpRequest, textStatus, errorThrown) {
    			              var e = {};
    			              e.code = XMLHttpRequest.status;
    			              e.msg = $.sberror.format(e.code, $sbtree.settings.asyncLevelLoadUrl);
    			              $.sberror.onError(e);
    		   	    	}
    		   	    };
    		   	    return Tree.controller.assembleFinishTreeConfig(selectableConfig);
    		    },
    		    
    		    /**
    		     * 可选树的选中或取消方法
    		     */
    		    _selectableTreeOnCheck: function(e, treeId, treeNode){
       	    		if(!treeNode.checked){
       	    			Tree.selectableTreeOncheck(e, treeId, treeNode);
       	    			return;
       	    		}
       	    		
       	    		//执行勾选操作
       	    		var selectableTree = $sbtree._getSelectableTree();
       	    		
       	    		var asynLoad = false;
       	    	    //#多选，当勾选父节点时，若子节点未加载，异步加载全部子节点
       	    		if($sbtree.settings.type == 'multiple' && treeNode.isParent && !isSelectBranchMode()){
       	 	    			var childNodes = treeNode.children;
       	 	 	    		if(childNodes === undefined){
       	 	 	    			asynLoad = true;
       	 	 	    			treeNode.onCheckLoad = true;
       	 	 	    			selectableTree.reAsyncChildNodes(treeNode, "refresh", false);
       	 	 	    		}else{
       	 	 	    			var checkedNodes = selectableTree.getCheckedNodes(true);
       	 	 	    			for(var checkIndex = 0, length = checkedNodes.length; checkIndex < length; checkIndex++){
       	 	 	    				var checkNode = checkedNodes[checkIndex];
       	 	 	    				if(checkNode.isParent && checkNode.children === undefined){
       	 	 	    					asynLoad = true;
       	 	 	    					checkNode.onCheckLoad = true;
       	 	 	    	    			selectableTree.reAsyncChildNodes(checkNode, "refresh", false);
       	 	 	    				}
       	 	 	    			}
       	 	 	    		}
       	    		}
       	    		 
       	    		//若勾选导致异步加载，此处不调用
       	    		if(!asynLoad){
       	    			Tree.selectableTreeOncheck(e, treeId, treeNode);
       	    		}
    		    },
    		    
    		    /**
    		     * 可选树的异步成功回调方法
    		     */
    		    _selectableTreeOnAsyncSuccess:function(e, treeId, treeNode){
       	    		var selectableTree = $sbtree._getSelectableTree();
       	    		if(isSingle()){
       	    			if(!isSelectBranchMode()){
       	    				Tree.controller.setNoCheckIfIsParentNode(selectableTree, treeNode);
	    				}
       	    		}else{
       	    			//多选：是勾选触发异步加载，需递归勾选子节点
       	    			if(treeNode.checked && treeNode.onCheckLoad){
       	    				$.sbtreetools.setChildNodesCheck(selectableTree, treeNode);
           	 	    		Tree.selectableTreeOncheck(e, treeId, treeNode);
       	 	    			return;
       	 	    		}
       	    		}
    		    },
    		    
    		    createSelectedTreeConfig:function(){
    		    	 var selectedConfig = Tree.controller.createInitTreeConfig();
    			   	 selectedConfig.callback = {
    			   		    onCheck :function(e, treeId, treeNode) {
    			   		    	 Tree.selectedTreeOncheck(e, treeId, treeNode, $sbtree);
    			   	    	}
    			   	 };
    			   	 return Tree.controller.assembleFinishTreeConfig(selectedConfig);
    		    },
    		    
    		    bindQueryBtnEvent:function(){
    		    	$sbtree._$queryBtn.bind("click", function(){
    		    		  var query = $sbtree._$queryInput.val();
    		    		  if($sbtree.settings.preventDuplicateQuery){
    		    			  if($sbtree._$queryInput.lastQuery === query){
            			    	  return;
            			      }
            			      $sbtree._$queryInput.lastQuery = query;
    		    		  }
    		    		 
    		  	    	  var queryRequest = {};
    		  	    	  queryRequest.rootId = $sbtree.settings.rootId;
    		  	    	  queryRequest.initDepth = $sbtree.settings.asyncInitDepth;
    		  	    	  queryRequest.query = query;
    		  	    	  $.extend(queryRequest, $sbtree.settings.otherRequestParam || {});
    		  	    	
    		  	    	  if($sbtree.settings.onQueryAjaxRequest && $.isFunction($sbtree.settings.onQueryAjaxRequest)){
    		  	    		  queryRequest = ($sbtree.settings.onQueryAjaxRequest)(queryRequest);
    				      }
    		  	    	
    		  	    	  $.ajax({type:"post",
    		  	            contentType:"application/json; charset=utf-8",
    		  	            dataType:"json",
    		  	            data:JSON.stringify(queryRequest),
    		  	            url:$sbtree.settings.asyncQueryUrl,
    		  	            success:function (treeResponse) {
    		  	            	  if($sbtree.settings.onQueryAjaxResponse && $.isFunction($sbtree.settings.onQueryAjaxResponse)){
    		  	            		  var executeFlag = ($sbtree.settings.onQueryAjaxResponse)(treeResponse);
    		  	            		  if(executeFlag === false){
    		  	            			  return;
    		  	            		  }
    	    	    		      }
    		  	            	   
    			    	          var selectableTree = $sbtree._getSelectableTree();
    			    	          $.sbtreetools.removeAllNodes(selectableTree);
    		      		          selectableTree.addNodes(null, treeResponse.treeNodes, false);
    		      		          
    		      		          if(isSingle()){
    		      		        	 Tree.controller.processSingleTreeNodeNoCheck(selectableTree);
    		      			      }
    		      		          
    		      		          if(queryRequest.query  !== null && queryRequest.query  !== ""){
    		      		        	  selectableTree.expandAll(true);
    		      		        	  
    		      		        	  //将没有加载的异步父节点的-号替换为+号
    		      		        	  var noAsyncLoadingOfParentNodes = selectableTree.getNodesByFilter(function(node){
    		      		        		   if(node.isParent && !node.zAsync){
    		      		        			   return true;
    		      		        		   }
    		      		        		   return false;
    		      		        	  });
    		      		        	  for(var index = 0, length = noAsyncLoadingOfParentNodes.length; index < length; index++){
    		      		        		  selectableTree.expandNode(noAsyncLoadingOfParentNodes[index], false, false, false, false);
    		    		    		  }
    		      		          }
    		  	            },
    		  	    	    error:function (XMLHttpRequest, textStatus, errorThrown) {
    			                var e = {};
    			                e.code = XMLHttpRequest.status;
    			                e.msg = $.sberror.format(e.code, this.url);
    			                $.sberror.onError(e);
    			            }
    		  	    	  });
    		  	    });
    		    },
    		    
    		    initTree:function(selectableConfig, selectedConfig){
    		    	   var request = {};
    		    	   request.rootId = $sbtree.settings.rootId;
    		  	       request.value =  Tree.controller.convertValueToStr($sbtree.settings.value);
    		  	       if(isSingle()){
    		  	    	   if(request.value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER).length > 1){
    		  	    		   request.value = request.value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER)[0];
    		  	    	   }
    		  	       }
    		  	       
    		  	       request.initDepth = $sbtree.settings.asyncInitDepth;
    		  	       request.saveType = $sbtree.settings.saveType;
    		  	       
    		  	       $.extend(request, $sbtree.settings.otherRequestParam || {});
    		  	       
    		  	       if($sbtree.settings.onAjaxRequest && $.isFunction($sbtree.settings.onAjaxRequest)){
    			           request = ($sbtree.settings.onAjaxRequest)(request);
		               }
    		  	       $.ajax({type:"post",
    			            contentType:"application/json; charset=utf-8",
    			            dataType:"json",
    			            data:JSON.stringify(request),
    			            url:$sbtree.settings.url,
    			            success:function (treeResponse) {
    			            	if($sbtree.settings.onAjaxResponse && $.isFunction($sbtree.settings.onAjaxResponse)){
    			            		 treeResponse = ($sbtree.settings.onAjaxResponse)(treeResponse);
    	    	    		    }
    			            	
    			            	Tree.controller.initDataFields(treeResponse);
    			            	
    			     		    //可选树的初始化
    			     		    $.fn.zTree.init($sbtree._$selectableTree, selectableConfig, treeResponse.treeNodes);
    			     		    
    			     		    //已选树的初始化
    			  		        $.fn.zTree.init($sbtree._$selectedTree, selectedConfig, treeResponse.selectedTreeNodes);
    			  	            
    			  		        //单选：可选的树，父节点隐藏单选按钮
    			  	    	    var selectableTree = $sbtree._getSelectableTree();
    			  		        if(isSingle()){
    			  		        	Tree.controller.processSingleTreeNodeNoCheck(selectableTree);
    			  		        }
    			  		         
    			  		        $sbtree.isInitTreeBuilded = true;
    			  		        if($sbtree.data("$tempSetValue")){
    			  		        	$sbtree.settings.value = $sbtree.data("$tempSetValue");
    			  		        	$sbtree.removeData("$tempSetValue");
    	                        } 
    			  		        
    			  		        //懒加载的setValue是异步的
    			  		        if($sbtree.settings.value){
  			   		                doSetValue($sbtree.settings.value, function(){
  			   		            	     initComplete();
  			   		                });
  			   		            }else{
  			   		         	    initComplete();
  			   		            }
    			            },
    			            error:function (XMLHttpRequest, textStatus, errorThrown) {
    			                var e = {};
    			                e.code = XMLHttpRequest.status;
    			                e.msg = $.sberror.format(e.code, this.url);
    			                $.sberror.onError(e);
    			            }
    		  	       });
    		    },
    		    
    		    processInitValue : function(value){
                     if(value === undefined){
                    	 return;
                     }
    				   
    			      var selectedTree = $sbtree._getSelectedTree();
    			      if(isSingle()){
    			    	    //单选，设置已选树中的父节点不可选中
    			    	    Tree.controller.setParentNodesNoCheck(selectedTree);
    			    	    
    			    	    //选中初始化值的节点
    			    	    var values =  Tree.controller.convertValueToArray(value);
    				    	var node;
    				    	if($sbtree.settings.saveType == "c"){
    				    		node = selectedTree.getNodeByParam("id", values[0]);
    				    	}else{
    				    		node = selectedTree.getNodeByParam("name", values[0]);
    				    	}
    				    	if(node !== undefined && node !== null){
    				    		if(isSelectBranchMode()){
    				    			//显示父节点的radio
    				    			if(node.isParent){
    				    				node.nocheck = false;
    				    				selectedTree.updateNode(node);
    				    				Tree.controller.updateMulColNocheck(node);
    				    			}
    				    		}
    				    		selectedTree.checkNode(node, true, true, true);
    				    	}
    			      }else{
    			    	   selectedTree.checkAllNodes(true);
    			      }
    			      selectedTree.expandAll(true);
    			},
    			
    			setValue: function(value, completeCallBack){
    				//懒加载调用的时候,需要考虑树是否已经构建完成
    				if(!$sbtree.isInitTreeBuilded){
    					$sbtree.data("$tempSetValue", value);
    					return;
    				}
    				
    				Tree.controller.clearSelectTree();
    				$sbtree.settings.value = value;
    				
        			var request = {};
        			request.rootId = $sbtree.settings.rootId;
        	   	    request.value =  Tree.controller.convertValueToStr(value);
        	   		if(isSingle()){
  		  	    	   if(request.value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER).length > 1){
  		  	    		   request.value = request.value.split($.sbtools.CONSTANTS.DEFAULT_DELIMITER)[0];
  		  	    	   }
  		  	        }
        	   	    request.saveType = $sbtree.settings.saveType;
        	   	    $.extend(request, $sbtree.settings.otherRequestParam || {});
        	   	    
        	   		//#2 获取设置值的节点
        	   	    var _this = this;
        	   	    $.ajax({type:"post",
    		                contentType:"application/json; charset=utf-8",
    		                dataType:"json",
    		                data:JSON.stringify(request),
    		                url:$sbtree.settings.asyncQueryParentNodesUrl,
    		                success:function (treeResponse) {
    		                	   $sbtree._getSelectedTree().addNodes(null, treeResponse.treeNodes, false);
    	    	   	    	       _this.processInitValue(value);
    	    	   	    	       setLabelAndHiddenValueControlFromSelectedValue();
    	    	   	    	       
    	    	   	    	       if(completeCallBack && $.isFunction(completeCallBack)){
    	    	   	    	    	   completeCallBack();
  	    	            	       }
    		                },
    		                error:function (XMLHttpRequest, textStatus, errorThrown) {
    			                var e = {};
    			                e.code = XMLHttpRequest.status;
    			                e.msg = $.sberror.format(e.code, this.url);
    			                $.sberror.onError(e);
    			            }
        	   	    });
    			}
    	};
    	
    	/**
         * 可选树的勾选或取消勾选的操作
         * 
         * 注：勾选不勾选逻辑依赖树配置的chkboxType或radioType属性
         * @param e
         * @param treeId
         * @param treeNode
        */
    	Tree.selectableTreeOncheck = function(e, treeId, treeNode){
    		if(!treeNode.checked){
        		//可选树节点取消勾选操作
        		var selectedTree = $sbtree._getSelectedTree();
        		var needNoCheckNode = selectedTree.getNodeByParam("id", treeNode.id);
        		if(needNoCheckNode !== null){
        			//调用此方法会触发已选树的onCheck回调方法，通过反向设置已选树未勾选，达到通过取消勾选可选树来删除已选树中的节点，
        			//依赖已选树的onCheck逻辑
        			selectedTree.checkNode(needNoCheckNode, false, true, true);
    			}
        		return;
        	}
    		
    		//可选树节点勾选操作
    		if(isSingle()){
    			Tree.singleSelectableTreeOnChecked(e, treeId, treeNode);
    		}else{
    			if($sbtree.settings.async){
    				Tree.multipleLazyLoadSelectableTreeOnChecked(e, treeId, treeNode);
       	        }else{
       	        	Tree.multipleAllLoadSelectableTreeOnChecked(e, treeId, treeNode);
       	        }
    		}
    	};
    	
    	/**
    	 * 单选:可选树勾选的操作
    	 */
    	Tree.singleSelectableTreeOnChecked = function(e, treeId, treeNode){
    		var selectableTree = $sbtree._getSelectableTree();
    		var selectedTree =  $sbtree._getSelectedTree();
    		
    		$.sbtreetools.removeAllNodes(selectedTree);
    		
    		var checkNodes = selectableTree.getCheckedNodes(true);
    		var parentNodes = $.sbtreetools.getParentNodes(checkNodes[0]);
    		
    		//注:直接使用addNodes中的节点,这些节点包含ztree增加的特殊属性,会影响增加到已选树中的逻辑
    		var addNodes = [];
    		//没有选中的父节点需要隐藏单选按钮
    		addNodes = addNodes.concat(Tree.transformToSimpleTreeNodes(parentNodes, {"nocheck": true}));
    		addNodes.push(Tree.transformToSimpleTreeNode(checkNodes[0]));
    		
    		selectedTree.addNodes(null, addNodes, false);
    		selectedTree.expandAll(true);
    	};
    	
    	/**
    	 * 多选完全加载:可选树的勾选的操作
    	 */
    	Tree.multipleAllLoadSelectableTreeOnChecked = function(e, treeId, treeNode){
    		var selectableTree = $sbtree._getSelectableTree();
    		var selectedTree = $sbtree._getSelectedTree();
    		
    		//需要考虑查询后,隐藏的已选节点
    		var chekcedNodes = selectableTree.getNodesByFilter(function(node){
    			                       if(node.checked){
    				                        return true;
    			                       }
    			                       return false;
    		                   });
    		
    		var addNodes = Tree.transformToSimpleTreeNodes(chekcedNodes, {nocheck:false});
    		 
    		$.sbtreetools.removeAllNodes(selectedTree);
    		selectedTree.addNodes(null, addNodes, false);
    		selectedTree.expandAll(true);
    	};
    	
    	/**
    	 * 多选懒加载:可选树的勾选的操作
    	 * 
    	 */
    	Tree.multipleLazyLoadSelectableTreeOnChecked = function(e, treeId, treeNode){
    		var selectableTree = $sbtree._getSelectableTree();
    		var selectedTree = $sbtree._getSelectedTree();
    		
    		var checkedNodes = selectableTree.getCheckedNodes(true);
    		var newSelectNodes = [];
    		for (var checkedIndex=0, checkedLength = checkedNodes.length; checkedIndex < checkedLength; checkedIndex++) {
    			var checkedNode = checkedNodes[checkedIndex];
    			
    			var selectedNode = selectedTree.getNodeByParam("id", checkedNode.id, null);
    			if(selectedNode === null){
    				newSelectNodes.push(Tree.transformToSimpleTreeNode(checkedNode, {"checked":true}));
    			}
    		}
    		
    		var copyNodes = selectedTree.transformToArray(selectedTree.getNodes());
    		$.sbtreetools.removeAllNodes(selectedTree);
    		
    		var addAllNodes = [];
    		for(var oldIndex = 0, oldLength = copyNodes.length; oldIndex < oldLength; oldIndex++){
    			addAllNodes.push(Tree.transformToSimpleTreeNode(copyNodes[oldIndex], {"checked":true}));
    		}
    		
    		addAllNodes = addAllNodes.concat(newSelectNodes);
    		
    		selectedTree.addNodes(null, addAllNodes, false);
    		selectedTree.expandAll(true);
    	};
    	
    	
    	/**
         * 已选树的勾选或取消勾选操作
         * @param e
         * @param treeId
         * @param treeNode
         * @param $sbtree
         */
    	Tree.selectedTreeOncheck = function(e, treeId, treeNode){
    		    //节点勾选则不处理
      		    if(treeNode.checked){
    	    		return;
    	    	}
      		    var selectableTree = $sbtree._getSelectableTree();
    			var selectedTree = $sbtree._getSelectedTree();
    			
    			var deleteNodes = selectedTree.getCheckedNodes(false);
    			for(var i = 0, length = deleteNodes.length; i < length; i++){
    				var node = selectableTree.getNodeByParam("id", deleteNodes[i].id);
    				if(node !== null){
    					node.checked = false;
    	    			selectableTree.updateNode(node);
    				}
      			    selectedTree.removeNode(deleteNodes[i], true);
      			    
      			    //删除节点的父节点需要保持其父节点的状态
      			    if(deleteNodes[i].getParentNode() != null){
      			    	var parentNode = deleteNodes[i].getParentNode();
      			    	parentNode.isParent = true;
      			    	selectedTree.updateNode(parentNode);
      			    	if(parentNode.children === undefined || parentNode.children.length <= 0){
      			    		selectedTree.expandNode(parentNode, true, false, false, false);
      			    	}
      			    }
    			}
    			
    			if(isSingle()){
    				$.sbtreetools.removeAllNodes(selectedTree);
    			} 
      	};
      	
      	/**
         * Main function
         */
        return this.each(function () {
            render();
        });
        
    };
    
   
})(jQuery);/**
 * Sinobest-Treetools:tree的工具方法
 * 
 */
(function ($) {
	
	$.extend({sbtreetools:{}});
	
    $.extend($.sbtreetools, {
    	
    	/**
    	 * 删除树中的所有节点
    	 * @param tree：树对象
    	 */
    	removeAllNodes:function(tree){
    		var treeNodes = tree.getNodes();
    		for (var i = treeNodes.length - 1; i >= 0; i--) {
    			tree.removeNode(treeNodes[i]);
    		}
    	},
    	
    	/**
    	 * 获取当前节点的所有父节点   
    	 * @param treeNode:树节点
    	*/
    	getParentNodes:function(treeNode){
    		if(treeNode.getParentNode() === null){
    			return [];
    		}
    		
    		var parentNodes = [];
    		var parentNode = treeNode.getParentNode();
    		while (parentNode !== null) {
    			parentNodes.push(parentNode);
    			parentNode = parentNode.getParentNode();
    		}
    		return parentNodes;
    	},
    	
    	/**
    	 * 当前节点为父节点，则设置其隐藏checkbox/radio,同时设置其所有子节点中是父节点的树节点也隐藏
    	 * 
    	 * @param tree:树对象
    	 * @param treeNode:树节点
    	 * @param afterNoCheckCallBack:树节点设置nocheck后的回调函数
    	 */
    	setNoCheckIfIsParentNode: function(tree, treeNode, afterNoCheckCallBack) {
    		if(!treeNode.isParent){
    			return;
    		}
    		
    		treeNode.nocheck = true;
    		tree.updateNode(treeNode);
    		if($.isFunction(afterNoCheckCallBack)){
    			afterNoCheckCallBack(treeNode);
    		}
    		
    		var childNodes = treeNode.children;
    		if (childNodes === undefined) {
    			return;
    		}
    		for (var childIndex = 0, length = childNodes.length; childIndex < length; childIndex++) {
    			var childNode = childNodes[childIndex];
    			this.setNoCheckIfIsParentNode(tree, childNode, afterNoCheckCallBack);
    		}
    	},
    	
    	/**
    	 * 设置树所有父节点隐藏checkbox/radio
    	 * @param tree:树对象
    	 * @param afterNoCheckCallBack:树节点设置nocheck后的回调函数
    	 */
    	setParentNodesNoCheck: function(tree, afterNoCheckCallBack) {
    		var treeNodes = tree.getNodes();
    		for (var i = 0, length = treeNodes.length; i < length; i++) {
    			var treeNode = treeNodes[i];
    			this.setNoCheckIfIsParentNode(tree, treeNode, afterNoCheckCallBack);
    		}
    	},
    	
    	/**
    	 * 设置当前节点的所有子节点勾选
    	 * 
    	 * @param tree:树对象
    	 * @param treeNode:树节点
    	*/
    	setChildNodesCheck: function(tree, treeNode) {
    		var childNodes = treeNode.children;
    		if (childNodes === undefined) {
    			return;
    		}
    		for (var childIndex = 0, length = childNodes.length; childIndex < length; childIndex++) {
    			var childNode = childNodes[childIndex];
    			childNode.checked = true;
    			tree.updateNode(childNode);
    			this.setChildNodesCheck(tree, childNode);
    		}
    	},
    	
    	/**
    	 * 获取节点的名称，且将所有父节点名称追加到当前节点前面
    	 * @param treeNode 当前节点
    	 * @param decollator 连接的分隔符
    	 */
    	getNodeNameAppendParentsName: function(treeNode,  decollator){
    		var parentNodes = this.getParentNodes(treeNode);
    		
    		//数组反向
    		parentNodes.reverse();
    		
    		var nodeName = "";
    		for(var parentIndex = 0, length = parentNodes.length; parentIndex < length; parentIndex++){
    			var parentNode = parentNodes[parentIndex];
    			nodeName = nodeName + parentNode.name + decollator;
    		}
    		
    		if(nodeName === ""){
    			nodeName = treeNode.name;
    		}else{
    		    nodeName = nodeName + treeNode.name;
    		}
    		
    		return nodeName;
    	},
    	
    	mulColumnController:{
    		    /**
    		     * 增加多列初始化配置信息
    		     * @param setting:树的配置参数
    		     * @param colModel:列模型
    		    */
    		    addMulColumnConfig : function(setting, colModel){
    		    	 if(colModel === null || colModel.length <= 0){
    		    		 return;
    		    	 }
    				 
    		    	 var _this = this;
    				 var mulColumnConfig = {
    						  view: { 
    						    	 addDiyDom: function(treeId, treeNode){
    						    	     _this.addMulColumnDiyDom(treeId, treeNode, colModel);
    						    	 }
    				          }
    				 };
    			     $.extend(setting, mulColumnConfig);
    		    },
    		
        		/**
        		 *  当树显示多列时,设置树节点的nocheck属性时，为了保证每个树节点中的列显示的宽度保持一致.
        		 *  当nocheck=true时， 需要增加一个虚拟html选择元素来占据隐藏的单选或多选的位置.
        		 *  当nocheck=false时，需要删除增加的虚拟的html选择元素
        		*/
        		processMulColNocheck : function(treeNode){
    				var $spanVirtualCheck = $("#" + treeNode.tId).children(".sinobest-tree-mulcol-virtual-check");
        			if(treeNode.nocheck){		
        				if($spanVirtualCheck.length <= 0){
        					var $spanCheck = $("#" + treeNode.tId).children("#" + treeNode.tId + "_check");
        					var $cloneNode = $spanCheck.clone();
        					$cloneNode.addClass("sinobest-tree-mulcol-virtual-check");
        					$cloneNode.removeAttr("id");
        					//此属性不删除,则虚构的html选择元素会有原始radio/checkbox的单击事件
        					$cloneNode.removeAttr("treenode_check");
        					$spanCheck.after($cloneNode); 
        				}
        			}else{
        				$spanVirtualCheck.remove();
        			}
        		},
        		
        		/**
        		 * 增加多列
        		 * @param treeId:树的ID
        		 * @param treeNode:树的节点
        		 * @param colModel:树的列模型
        		 */
        		addMulColumnDiyDom : function(treeId, treeNode, colModel){
        			this.processMulColNocheck(treeNode);
        			
        			var $aObj = $("#" + treeNode.tId + "_a");
        			for(var i = 0, length = colModel.length; i < length;i++){
        				var column = colModel[i];
        				
        				//name列必须显示在第一位的主列
        				if(column.id == "name"){
        					$aObj.children("span[id='"+treeNode.tId+"_span']").css("width", column.width)
        					.addClass("sinobest-tree-span-name-column");
        					continue;
        				}
        				
        				var $column = $("<span></span>");
        				$column.attr("id", treeNode.tId + '_' + column.id);
        				$column.html(treeNode[column.id]);
        				$column.css("width", column.width).addClass("sinobest-tree-span-common-column");
        				$column.attr("title", treeNode[column.id]);
        				
        				$aObj.append($column);
        			}
        		},
        		
        		/**
        		 * 增加多列的值
        		 * @param treeNode:树节点
        		 * @param originalValue:原始值  JSON对象
        		 * @param colModel:列模型
        		 */
        		addMulColumnValue : function(treeNode, originalValue, colModel){
        			if(colModel === null || colModel.length <= 0){
        				return originalValue;
        			}
        			
        			for(var i = 0, length = colModel.length; i < length; i++){
        				var column = colModel[i];
        				if(originalValue.hasOwnProperty(column.id)){
        					continue;
        				}
        				
        				originalValue[column.id] = treeNode[column.id];
        			}
        			return originalValue;
        		}
    	}
    	
    });
    
})(jQuery);/**
 * Sinobest-Ueditor:百度富文本组件
 * 
 * Dependency:ueditor.config.js,ueditor.all.js,sinobest.base.js,sinobest.tools.js
 */
(function ($) {
    var defaults = {
        id:null,          
        name:null,        
        value:null,       
        mode:"simple",     //simple,full
        className:"sinobest-ueditor",
        setting:{
        	elementPathEnabled:false,
	        wordCount:false,
	        maximumWords:Number.MAX_VALUE,
	        autoHeightEnabled:false,
	        initialFrameHeight:300,
	        serverUrl:"#"
        },
        required:false,
        disabled:false,
        readonly:false,
        callback:null,
        onInitComplete:null,
        serverparam:null,
        editorListeners:null
    };
    
    $.fn.sbueditor = function(options) {
        var $sbueditor = this;
        var settings;
        if(isContain()){
            if(options){
            	if(options.value === undefined || options.value === null){
            		options.value = getter().getValue();
            	}
                settings = $.extend(true, {}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            }else{
                return getter();
            }
        }else{
            settings = $.extend(true, {}, defaults, options || {});
        }

        $sbueditor.settings = settings;

        function getter(){
           return $sbueditor.data("$sbueditor");
        }
        
        function setter(){
        	$sbueditor.data("$sbueditor", $sbueditor);
        }
        
        function isContain(){
            return $sbueditor.data("$sbueditor");
        }
        
        $.sbbase.mixinWidget($sbueditor);

        $sbueditor.getValue = function () {
        	if(!$sbueditor.editor.hasContents()){
        		return "";
        	}
            return $sbueditor.editor.getContent();
        };

        $sbueditor.setValue = function (value) {
        	if(!$sbueditor.isCreatedEditor){
        		$sbueditor.data("$tempSetValue", value);
        		return $sbueditor;
        	}
            $sbueditor.editor.setContent(value);
        	$sbueditor.settings.value = value;
            return $sbueditor;
        };
        
        $sbueditor.getEditor = function(){
        	return $sbueditor.editor;
        };
        
        $sbueditor.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
                if (v !== undefined && v !== null) {
                    if (k == 'value') {
                    	$sbueditor.setValue(v);
                    } else {
                        if (k == 'required') {
                        	$sbueditor.settings.required = v;
                        } else if (k == 'readonly') {
                        	$sbueditor.settings.readonly = v;
                        	if($sbueditor.isCreatedEditor){
                        		readonly(v);
                        		toggleReadonlyClass(v);
                        	}else{
                        		$sbueditor.data("$tempReadonly", v);
                        	}
                        } else if(k == 'disabled'){
                        	$sbueditor.settings.disabled = v;
                        	if($sbueditor.isCreatedEditor){
                        		readonly(v);
                        	}else{
                        		$sbueditor.data("$tempDisabled", v);
                        	}
                        }
                        $sbueditor.attr(k, v);
                    }
                } else {
                	$sbueditor.removeAttr(k);
                }
            });
            return $sbueditor;
        };
		
        $sbueditor.getDefaultOptions = function(){
        	return defaults;
        };

        $sbueditor.reload = function () {
        	$sbueditor.empty();
        	$sbueditor.isCreatedEditor = false;
        	$sbueditor.editor.destroy();
        	$.sbtools.initController.removeInitCompleteFlag($sbueditor, "$sbueditor");
            return render();
        };

        $sbueditor.validate = function () {
            var isFunc = $.isFunction($sbueditor.settings.callback);
            if (isFunc) {
            	return this.settings.callback.apply(this, [this.settings, this.getValue()]);
            } else {
                if (settings.required) {
                    if(!$sbueditor.editor.hasContents()){
                    	$sbueditor._$textarea.val("");
                    } 
                    
                	var isOk = false;
                    isOk = $.sbvalidator.required($sbueditor._$textarea[0], $sbueditor.getValue());
                    if (!isOk) {
                        return $.sbvalidator.TEXT_REQUIRED;
                    }
                }
                return ""; //验证通过
            }
        };

        $sbueditor.getName = function(){
        	return  $sbueditor.settings.name;
        };
        
        function initComplete(){
            $.sbtools.initController.initComplete($sbueditor, "$sbueditor", function(){
                if(!isContain()){
                    setter();
                }
            }, $sbueditor.settings.onInitComplete);
        }

        function render() {
            $sbueditor.addClass($sbueditor.settings.className);
            $sbueditor.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            if($sbueditor.settings.id === null){
            	$sbueditor.settings.id = $sbueditor.attr("id") + "_ueditor";
            }
            renderTextArea();

            buildRichTextEditor();
            
            setter();
            return $sbueditor;
        }

        function renderTextArea(){
        	var $textarea = $("<textarea></textarea>");
        	if($sbueditor.settings.id) {
        		$textarea.attr("id", $sbueditor.settings.id);
        	}
        	
        	if($sbueditor.settings.name) {
        		$textarea.attr("name", $sbueditor.settings.name);
        	}
        	
        	$textarea.attr('required', $sbueditor.settings.required);
        	
            $sbueditor.append($textarea);
            $sbueditor._$textarea = $textarea;
        }
        
        function buildRichTextEditor(){
        	$sbueditor.settings.setting.readonly = $sbueditor.settings.readonly || $sbueditor.settings.disabled;
        	var toolBars = getToolbars();
        	if(toolBars !== null && toolBars.length > 0){
        		$sbueditor.settings.setting.toolbars = toolBars;
        	}
        	
        	var editor = UE.getEditor($sbueditor.settings.id, $sbueditor.settings.setting);
        	registerEditorListeners(editor);
        	
        	editor.ready(function() {
        		afterCreate();
        		
        		if($sbueditor.settings.serverparam){
        			editor.execCommand('serverparam', $sbueditor.settings.serverparam);
        		}
        	});
        	$sbueditor.editor = editor;
        }
        
        function registerEditorListeners(editor){
        	if($sbueditor.settings.editorListeners){
        		for(var listener in $sbueditor.settings.editorListeners){
        			 addListener(editor, listener, $sbueditor.settings.editorListeners[listener]);
            	}
            }
        }
        
        function addListener(editor, listener, listenerAction){
        	editor.addListener(listener, function( ) {
        		listenerAction.apply($sbueditor, arguments);
         	});
        }
        
        function afterCreate(){
	    	 $sbueditor.isCreatedEditor = true;
	        
	    	 toggleReadonlyClass($sbueditor.settings.readonly);
	         if($sbueditor.data("$tempReadonly")){
	        	 var tempReadonly = $sbueditor.data("$tempReadonly");
	        	 $sbueditor.removeData("$tempReadonly");
	        	 readonly(tempReadonly);
	        	 toggleReadonlyClass(tempReadonly);
	         }
	         
	         if($sbueditor.data("$tempDisabled")){
	        	 var tempDisabled = $sbueditor.data("$tempDisabled");
	        	 $sbueditor.removeData("$tempDisabled");
	        	 readonly(tempDisabled);
	         }
	         
	         if($sbueditor.data("$tempSetValue")){
	        	 $sbueditor.settings.value = $sbueditor.data("$tempSetValue");
	        	 $sbueditor.removeData("$tempSetValue");
	         }
	         
	         if($sbueditor.settings.value){
	        	 $sbueditor.setValue($sbueditor.settings.value);
		     } 
	         initComplete();
        }
        
        function readonly(v){
        	if(v){
        		$sbueditor.editor.setDisabled();
        	}else{
        		$sbueditor.editor.setEnabled();
        	}
        }
        
        function toggleReadonlyClass(flag){
            $.sbtools.toggleRichEditorReadonlyClass($sbueditor.find(".edui-editor-iframeholder"), flag);
        }
        
        function getToolbars(){
        	if($sbueditor.settings.setting.toolbars){
        		return $sbueditor.settings.setting.toolbars;
        	}
        	
        	if($sbueditor.settings.mode == "simple"){
        		return  [[ 'source', '|', 'undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', 
                           '|', 'superscript', 'subscript', '|', 'forecolor', 'backcolor', '|', 'removeformat', 
                           '|', 'insertorderedlist', 'insertunorderedlist', '|', 'selectall', 'cleardoc', 'paragraph', 
                           '|', 'fontfamily', 'fontsize', '|', 'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify',
                           '|', 'link', 'unlink', '|', 'simpleupload', 'insertimage',  'attachment', '|', 'map',
                           '|', 'horizontal', 'print', 'preview', 'fullscreen', 'drafts', 'formula']];
        	}else{
                //full		
        		return null;
        	}
        }
        
        return this.each(function () {
            render();
        });
    };
})(jQuery);/**
 * Sinobest-Validator:验证组件
 * 
 */
(function ($) {
    $.extend({sbvalidator:{ }});
    $.extend($.sbvalidator, {
        required:function (element, value) {
            if (element.nodeName.toLowerCase() === "select") {
                // could be an array for select-multiple or a string, both are fine this way
                var val = $(element).val();
                return val && val.length > 0;
            }
            if (this.checkable(element)) {
                return this.getLength(value, element) > 0;
            }
            return $.trim(value).length > 0;
        },
        checkable:function (element) {
            return ( /radio|checkbox/i ).test(element.type);
        }, getLength:function (value, element) {
            switch (element.nodeName.toLowerCase()) {
                case "select":
                    return $("option:selected", element).length;
                case "input":
                    if (this.checkable(element)) {
                        return this.findByName(element.name).filter(":checked").length;
                    }
            }
            return value.length;
        }, findByName:function (name) {
            return $("input[name='" + name + "']");
        }, minlength:function (element, value, param) {
            var length = $.isArray(value) ? value.length : this.getLength(value, element);
            return length >= param;
        }, maxlength:function (element, value, param) {
            var length = $.isArray(value) ? value.length : this.getLength(value, element);
            return length <= param;
        }, valid:function (regex, value) {
            return regex.test(value);
        }, 
        TEXT_REQUIRED:"\u4e0d\u80fd\u4e3a\u7a7a",
        TEXT_MIN_LENGTH:"\u957f\u5ea6\u4e0d\u80fd\u5c0f\u4e8e\u007b\u0030\u007d\u4e2a\u5b57\u7b26",
        TEXT_MAX_LENGTH:"\u957f\u5ea6\u4e0d\u80fd\u5927\u4e8e\u007b\u0030\u007d\u4e2a\u5b57\u7b26",
        TEXT_REGEX:"\u683c\u5f0f\u4e0d\u6b63\u786e",
        AREASELECT_TEXT_REQUIRED:"\u8bf7\u586b\u5199\u5b8c\u6574\u7684\u5730\u533a\u4fe1\u606f",
        minLengthPromptMessage:function(minLength){
        	return this.TEXT_MIN_LENGTH.format(minLength);
        },
        
        maxLengthPromptMessage:function(maxLength){
        	return this.TEXT_MAX_LENGTH.format(maxLength);
        }
    });
})(jQuery);/**
 * Sinobest-Wizard:表单向导组件
 * 
 * Dependency:sinobest.tools.js
 */
(function ($) {
    var defaults = {
        className: "sinobest-wizard",
        submitButton: "",
        onSeekNext: null,// 切换下一界面后
        onBeforeSeekNext: null,//切换到下一界面前
        onSeekPrev: null,// 切换上一界面后
        onBeforeSeekPrev: null,//切换到上一界面前
        next: "下一步",
        prev: "上一步",
        customStepTitle: function (i) {
            return "第" + (i + 1) + "步";
        },
        stepContainerWidth:null,
        stepWidth:null,
        onInitComplete:null
    };

    $.fn.sbwizard = function (options) {
        var $wizard = this;
        var settings;
        if (isContain()) {
            if (options) {
                settings = $.extend({}, getter().settings, options || {});
                getter().settings = settings;
                getter().reload();
                return getter();
            } else {
                return getter();
            }
        } else {
            settings = $.extend({}, defaults, options || {});
        }

        $wizard.settings = settings;

        function getter() {
            return $wizard.data("$wizard");
        }

        function setter() {
            $wizard.data("$wizard", $wizard);
        }

        function isContain() {
            return $wizard.data("$wizard");
        }
        
        $.sbbase.mixinWidget($wizard, {isAddValueMethod:false});

        $wizard.seekNext = function () {
            var current = $wizard.$steps.find("li.current").attr('data-index');
            // 最后一步没有下一步
            $wizard.find("a.next").eq(current).click();
        };
        $wizard.seekPrev = function () {
            var current = $wizard.$steps.find("li.current").attr('data-index');
            if(current == 0){
            	return;
            }
            // 第一步没有上一步
            $wizard.find("a.prev").eq((current - 1)).click();
        };

        $wizard.setState = function (stateJson) {
            $.each(stateJson, function (k, v) {
            	if (v !== undefined && v !== null){
                    $wizard.attr(k, v);
                } else {
                    $wizard.removeAttr(k);
                }
            });
            return $wizard;
        };
		
        $wizard.getDefaultOptions = function(){
        	return defaults;
        };

        $wizard.reload = function () {
        	$wizard.$steps.remove();
        	$wizard.empty();
        	$wizard.html($wizard.originalHtml);
        	$.sbtools.initController.removeInitCompleteFlag($wizard, "$sbwizard");
            return render();
        };

        /**
         * 上一步按钮是否显示
         */
        $wizard.displayPrevButton = function(stepIndex, show){
        	 var $stepPrex = $wizard.find("#step" + stepIndex + "Prev");
        	 if(show){
        		 $stepPrex.show();
        		 $stepPrex.removeData("dataHidden");
        	 }else{
        		 $stepPrex.hide();
        		 $stepPrex.data("dataHidden", true);
        	 }
        };
        
        /**
         * 下一步按钮是否显示
         */
        $wizard.displayNextButton = function(stepIndex, show){
        	 var $stepNext =  $wizard.find("#step" + stepIndex + "Next");
        	 if(show){
        		 $stepNext.show();
        	 }else{
        		 $stepNext.hide();
        	 }
        };

        function initComplete(){
            $.sbtools.initController.initComplete($wizard, "$sbwizard", function(){
                if(!isContain()){
                    setter();
                }
            }, $wizard.settings.onInitComplete);
        }
        
        /**
         * Init
         */
        function render() {
        	$wizard.originalHtml = $wizard.html();
        	
            $wizard.addClass($wizard.settings.className);
            $wizard.addClass($.sbtools.CONSTANTS.UICLASS.BASE_UI);
            
            var steps = $wizard.find("fieldset");
            $wizard.count = steps.size();
            $wizard.submitBtnName = '#' + $wizard.settings.submitButton;
            $wizard.trueStepIndex = 0;
            $($wizard.submitBtnName).hide();
            
            $wizard.$steps = $('<div class="sinobest-wizard-step-container"></div>');
            if($wizard.settings.stepContainerWidth){
            	$wizard.$steps.css("width", $wizard.settings.stepContainerWidth);
            }
            $wizard.$stepsContent = $('<div class="sinobest-wizard-step-content"></div>');
            $wizard.$steps.append($wizard.$stepsContent);
            
            $wizard.before($wizard.$steps);
            
            steps.each(function (i) {
                $(this).wrap("<div id='step" + i + "'></div>");
                $(this).append("<p id='step" + i + "commands'></p>");

                var name = $(this).find("legend").html();
                
                var numberClass = "step-number";
                var number = i + 1;
                if(i == steps.size() - 1){
                	numberClass = "step-tick";
                	number = "";
                }
                
                var desc = '<div class="sinobest-wizard-step"><div data-index="' + i + '" class="step-number-content step-status-gray"><div class="'+numberClass+'">'+number+'</div></div><div class="step-label">'+name+'</div>';
                $wizard.$stepsContent.append(desc);
                
                if (i == 0) {
                    createNextButton(i);
                    selectStep(i);
                } else if (i == $wizard.count - 1) {
                    $("#step" + i).hide();
                    createPrevButton(i);
                } else {
                    $("#step" + i).hide();
                    createPrevButton(i);
                    createNextButton(i);
                }
            });
            
            if($wizard.settings.stepWidth){
            	$wizard.$stepsContent.find(".sinobest-wizard-step").css("width", $wizard.settings.stepWidth);
            }
            
            $wizard.$stepsContent.find(".step-number-content").off('click').on('click', function () {
                var current = $wizard.$stepsContent.find(".step-status-current");
                var thisIndex = $(this).attr('data-index');
                var currentIndex = current.attr('data-index');
                if (thisIndex > $wizard.trueStepIndex) {
                    return;
                } else {
                	//上一步按钮设置为隐藏时,之前向导是否可以点击需要判断
                	for(var stepIndex = $wizard.trueStepIndex; stepIndex > thisIndex; stepIndex--){
                		if($wizard.find("#step" + stepIndex + "Prev").data("dataHidden")){
                			return;
                		}
                	}
                	
                    // jump back
                    jumpTo(thisIndex, currentIndex);
                }
            });
            
            initComplete();
            setter();
            return $wizard;
        }

        function createPrevButton(i) {
            var stepName = "step" + i;
			var a = $("<a href='javascript:void(0);' class='prev'></a>");
			a.attr("id",stepName+"Prev");
			a.text("<"+$wizard.settings.prev);
            $("#" + stepName + "commands").append(a);

            $("#" + stepName + "Prev").bind("click", function (e) {
                var isFunc = $.isFunction(options.onBeforeSeekPrev);
                if (isFunc) {
                    options.onBeforeSeekPrev(i);
                }

                $("#" + stepName).hide();
                $("#step" + (i - 1)).show();
                $($wizard.submitBtnName).hide();
                selectStep(i - 1);

                var isOnSeekPrevFunc = $.isFunction(options.onSeekPrev);
                if (isOnSeekPrevFunc) {
                    options.onSeekPrev(i);
                }
            });
        }

        function createNextButton(i) {
            var stepName = "step" + i;
			var a = $("<a href='javascript:void(0);' class='next'></a>");
			a.attr("id",stepName+"Next");
			a.text($wizard.settings.next+">");
            $("#" + stepName + "commands").append(a);

            $("#" + stepName + "Next").bind("click", function (e) {
                // on before seek next
                var isFunc = $.isFunction(options.onBeforeSeekNext);
                var isGoingon = true;// going on as default
                if (isFunc) {
                    isGoingon = options.onBeforeSeekNext(i);
                }
                if (isGoingon) {
                    $("#" + stepName).hide();
                    $("#step" + (i + 1)).show();

                    $wizard.trueStepIndex = i + 1;

                    if (i + 2 == $wizard.count)
                        $($wizard.submitBtnName).show();
                    selectStep(i + 1);

                    // on seek next
                    var isOnSeekNextFunc = $.isFunction(options.onSeekNext);
                    if (isOnSeekNextFunc) {
                        options.onSeekNext(i);
                    }
                }
            });
        }

        function selectStep(i) {
        	var currentStatusClass = "step-status-current";
        	var grayStatusClass = "step-status-gray";
        	var passedStatsuClass = "step-status-passed";
        	var stepNumberContentSelectorPreifx = ".step-number-content[data-index='";
        	var stepNumberContentSelectorSuffix =  "']";
        	
        	$wizard.$stepsContent.find("."+currentStatusClass).removeClass(currentStatusClass).addClass(grayStatusClass);
        	$wizard.$stepsContent.find(stepNumberContentSelectorPreifx + i + stepNumberContentSelectorSuffix)
        	             .removeClass(grayStatusClass).removeClass(passedStatsuClass).addClass(currentStatusClass);
        	
        	var currentIndex = Number(i);
        	for(var ltIndex = 0; ltIndex < currentIndex; ltIndex++){
        		$wizard.$stepsContent.find(stepNumberContentSelectorPreifx + ltIndex + stepNumberContentSelectorSuffix)
        		         .removeClass(grayStatusClass).addClass(passedStatsuClass);
        	}
        	for(var gtIndex = currentIndex + 1;gtIndex < $wizard.count; gtIndex++){
        		$wizard.$stepsContent.find(stepNumberContentSelectorPreifx + gtIndex + stepNumberContentSelectorSuffix)
        		         .removeClass(passedStatsuClass).addClass(grayStatusClass);
        	}
        }

        function jumpTo(targetIndex, currentIndex) {
            $("#step" + parseInt(currentIndex)).hide();
            $("#step" + parseInt(targetIndex)).show();
            if ((parseInt(targetIndex) + 1) < $wizard.count) {
                $($wizard.submitBtnName).hide();
            } else {
                $($wizard.submitBtnName).show();
            }
            selectStep(targetIndex);
        }

        return this.each(function () {
            render();
        });
    };
})(jQuery);