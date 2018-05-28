package com.hq.service;

import com.hq.entity.HqCompanyEntity;

import java.util.List;
import java.util.Map;

/**
 * 
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2018-03-29 11:43:01
 */
public interface HqCompanyService {
	
	HqCompanyEntity queryObject(Integer id);
	
	List<HqCompanyEntity> queryList(Map<String, Object> map);
	
	int queryTotal(Map<String, Object> map);
	
	void save(HqCompanyEntity hqCompany);
	
	void update(HqCompanyEntity hqCompany);
	
	void delete(Integer id);
	
	void deleteBatch(Integer[] ids);
}
