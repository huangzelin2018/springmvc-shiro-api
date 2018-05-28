package com.hq.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hq.entity.SysDepartmentEntity;
import com.hq.service.SysDepartmentService;
import com.hq.utils.Constant;
import com.hq.utils.PageUtils;
import com.hq.utils.Query;
import com.hq.utils.R;


/**
 * 
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2017-07-05 15:26:48
 */
@RestController
@RequestMapping("sysdepartment")
public class SysDepartmentController extends AbstractController {
	@Autowired
	private SysDepartmentService sysDepartmentService;
	
	/**
	 * 列表
	 */
	@RequestMapping("/list")
	@RequiresPermissions("sysdepartment:list")
	public R list(@RequestParam Map<String, Object> params){
		//查询列表数据
        Query query = new Query(params);

		List<SysDepartmentEntity> sysDepartmentList = sysDepartmentService.queryList(query);
		int total = sysDepartmentService.queryTotal(query);
		
		PageUtils pageUtil = new PageUtils(sysDepartmentList, total, query.getLimit(), query.getPage());
		
		return R.ok().put("page", pageUtil);
	}
	
	@RequestMapping("/perms")
	@RequiresPermissions("sysdepartment:perms")
	public R perms(){
		//查询列表数据
		List<SysDepartmentEntity> departmentList = null;
		
		//只有超级管理员，才能查看所有管理员列表
		if(getUserId() == Constant.SUPER_ADMIN){
			departmentList = sysDepartmentService.queryList(new HashMap<String,Object>());
		}else{
			departmentList = sysDepartmentService.queryDepartList(getDeptId());
		}
		
		return R.ok().put("departmentList", departmentList);
	}
	
	/**
	 * 信息
	 */
	@RequestMapping("/info/{id}")
	@RequiresPermissions("sysdepartment:info")
	public R info(@PathVariable("id") Long id){
		SysDepartmentEntity sysDepartment = sysDepartmentService.queryObject(id);
		
		return R.ok().put("sysDepartment", sysDepartment);
	}
	
	/**
	 * 保存
	 */
	@RequestMapping("/save")
	@RequiresPermissions("sysdepartment:save")
	public R save(@RequestBody SysDepartmentEntity sysDepartment){
		sysDepartmentService.save(sysDepartment);
		
		return R.ok();
	}
	
	/**
	 * 修改
	 */
	@RequestMapping("/update")
	@RequiresPermissions("sysdepartment:update")
	public R update(@RequestBody SysDepartmentEntity sysDepartment){
		sysDepartmentService.update(sysDepartment);
		
		return R.ok();
	}
	
	/**
	 * 删除
	 */
	@RequestMapping("/delete")
	@RequiresPermissions("sysdepartment:delete")
	public R delete(@RequestBody Long[] ids){
		sysDepartmentService.deleteBatch(ids);
		
		return R.ok();
	}
	
}
