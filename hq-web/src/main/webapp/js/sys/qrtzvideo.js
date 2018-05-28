$(function () {
    $("#jqGrid").jqGrid({
        url: '../sys/qrtzvideo/list',
        datatype: "json",
        colModel: [
			{ label: '视频id', name: 'videoId', index: 'video_id', width: 50, key: true },
            { label: '视频名称', name: 'videoTitle', index: 'video_title', width: 80 },
            { label: '视频链接', name: 'videoUrl', index: 'video_url', width: 80 },
            { label: '发布人 ', name: 'username', index: 'username', width: 80 },
			{ label: '发布时间', name: 'createTime', index: 'create_time', width: 80 },
            { label: '是否下架', name: 'idUser', index: 'id_user', width: 80 , formatter: function(value, options, row){
                    if(value === 0){
                        return '上架';
                    }else if(value === 1){
                        return '下架';
                    }
                }}
        ],
		viewrecords: true,
        height: 385,
        rowNum: 10,
        rowList : [10,30,50],
        rownumbers: true,
        rownumWidth: 25,
        autowidth:true,
        multiselect: true,
        pager: "#jqGridPager",
        jsonReader : {
            root: "page.list",
            page: "page.currPage",
            total: "page.totalPage",
            records: "page.totalCount"
        },
        prmNames : {
            page:"page",
            rows:"limit",
            order: "order"
        },
        gridComplete:function(){
            //隐藏grid底部滚动条
            $("#jqGrid").closest(".ui-jqgrid-bdiv").css({ "overflow-x" : "hidden" });
        }
    });
});


var vm = new Vue({
	el:'#rrapp',
	data:{
		showList: true,
		title: null,
		qrtzVideo: {},
        updateQrtzVideo:{
            videoId:'s',
            videoTitle:'122',
            videoUrl:'ww',
            createTime:'1234567890-',
        }
	},
	methods: {
		query: function () {
			vm.reload();
		},
		add: function(){
			vm.showList = false;
			vm.title = "新增";
			vm.qrtzVideo = {};
		},
		update: function (event) {
			var videoId = getSelectedRow();
			if(videoId == null){
				return ;
			}
			vm.showList = false;
            vm.title = "修改";

            vm.getInfo(videoId)
        },
        shelve: function (event) {
            var videoId = getSelectedRow();
            $.ajax({
                type: "get",
                url:  "../sys/qrtzvideo/shelve?videoId=" + videoId,
                dataType:"json",
                success: function(r){
                    if(r.code == 0){
                        alert('操作成功', function(index){
                            $("#jqGrid").trigger("reloadGrid");
                        });
                    }else{
                        alert(r.msg);
                    }
                }
            });
        },
        saveOrUpdate: function (event) {
            var url = vm.qrtzVideo.videoId == null ? "../sys/qrtzvideo/save" : "../sys/qrtzvideo/update";
            $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(vm.qrtzVideo),
                success: function(r){
                    if(r.code == 0){
                        alert('操作成功', function(index){
                            $("#jqGrid").trigger("reloadGrid");
                        });
                    }else{
                        alert(r.msg);
                    }
                }
            });
        },
		del: function (event) {
			var videoIds = getSelectedRows();
			if(videoIds == null){
				return ;
			}

			confirm('确定要删除选中的记录？', function(){
				$.ajax({
					type: "POST",
				    url: "../sys/qrtzvideo/delete",
				    data: JSON.stringify(videoIds),
				    success: function(r){
						if(r.code == 0){
							alert('操作成功', function(index){
								$("#jqGrid").trigger("reloadGrid");
							});
						}else{
							alert(r.msg);
						}
					}
				});
			});
		},
		getInfo: function(videoId){
			$.get("../sys/qrtzvideo/info/"+videoId, function(r){
                vm.qrtzVideo = r.qrtzVideo;
                console.log(videoId);
            });
		},
		reload: function (event) {
            vm.showList = true;
        /*    var page = $("#jqGrid").jqGrid('getGridParam','page');
            $("#jqGrid").jqGrid('setGridParam',{
            	page:page
            }).trigger("reloadGrid");*/
        }
	},

});