package com.hq.service;

import com.hq.entity.SysDepartmentEntity;

import java.util.List;
import java.util.Map;

/**
 * 
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2017-07-05 15:26:48
 */
public interface SysDepartmentService {
	
	SysDepartmentEntity queryObject(Long id);
	
	List<SysDepartmentEntity> queryList(Map<String, Object> map);
	
	int queryTotal(Map<String, Object> map);
	
	void save(SysDepartmentEntity sysDepartment);
	
	void update(SysDepartmentEntity sysDepartment);
	
	void delete(Long id);
	
	void deleteBatch(Long[] ids);
	
	List<SysDepartmentEntity> queryDepartList(Long deptId);
	
}
