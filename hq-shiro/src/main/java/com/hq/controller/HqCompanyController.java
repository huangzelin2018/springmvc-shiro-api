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

import com.hq.entity.HqCompanyEntity;
import com.hq.entity.SysRoleEntity;
import com.hq.service.HqCompanyService;
import com.hq.utils.Constant;
import com.hq.utils.PageUtils;
import com.hq.utils.Query;
import com.hq.utils.R;


/**
 * 
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2018-03-29 11:43:01
 */
@RestController
@RequestMapping("hqcompany")
public class HqCompanyController extends AbstractController{
	@Autowired
	private HqCompanyService hqCompanyService;
	
	/**
	 * 列表
	 */
	@RequestMapping("/list")
	@RequiresPermissions("hqcompany:list")
	public R list(@RequestParam Map<String, Object> params){
		//查询列表数据
        Query query = new Query(params);

		List<HqCompanyEntity> hqCompanyList = hqCompanyService.queryList(query);
		int total = hqCompanyService.queryTotal(query);
		
		PageUtils pageUtil = new PageUtils(hqCompanyList, total, query.getLimit(), query.getPage());
		
		return R.ok().put("page", pageUtil);
	}
	
	@RequestMapping("/select")
	@RequiresPermissions("hqcompany:select")
	public R select(){
		Map<String, Object> map = new HashMap<>();
		
		//如果不是超级管理员，则只查询自己所拥有的角色列表
		if(getUserId() != Constant.SUPER_ADMIN){
			map.put("createUserId", getUserId());
		}
		List<HqCompanyEntity> list = hqCompanyService.queryList(map);
		
		return R.ok().put("list", list);
	}
	/**
	 * 信息
	 */
	@RequestMapping("/info/{id}")
	@RequiresPermissions("hqcompany:info")
	public R info(@PathVariable("id") Integer id){
		HqCompanyEntity hqCompany = hqCompanyService.queryObject(id);
		
		return R.ok().put("hqCompany", hqCompany);
	}
	
	/**
	 * 保存
	 */
	@RequestMapping("/save")
	@RequiresPermissions("hqcompany:save")
	public R save(@RequestBody HqCompanyEntity hqCompany){
		hqCompanyService.save(hqCompany);
		
		return R.ok();
	}
	
	/**
	 * 修改
	 */
	@RequestMapping("/update")
	@RequiresPermissions("hqcompany:update")
	public R update(@RequestBody HqCompanyEntity hqCompany){
		hqCompanyService.update(hqCompany);
		
		return R.ok();
	}
	
	/**
	 * 删除
	 */
	@RequestMapping("/delete")
	@RequiresPermissions("hqcompany:delete")
	public R delete(@RequestBody Integer[] ids){
		hqCompanyService.deleteBatch(ids);
		
		return R.ok();
	}
	
}
