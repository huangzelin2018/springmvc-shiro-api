package com.hq.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

import com.hq.dao.HqCompanyDao;
import com.hq.entity.HqCompanyEntity;
import com.hq.service.HqCompanyService;



@Service("hqCompanyService")
public class HqCompanyServiceImpl implements HqCompanyService {
	@Autowired
	private HqCompanyDao hqCompanyDao;
	
	@Override
	public HqCompanyEntity queryObject(Integer id){
		return hqCompanyDao.queryObject(id);
	}
	
	@Override
	public List<HqCompanyEntity> queryList(Map<String, Object> map){
		return hqCompanyDao.queryList(map);
	}
	
	@Override
	public int queryTotal(Map<String, Object> map){
		return hqCompanyDao.queryTotal(map);
	}
	
	@Override
	public void save(HqCompanyEntity hqCompany){
		hqCompanyDao.save(hqCompany);
	}
	
	@Override
	public void update(HqCompanyEntity hqCompany){
		hqCompanyDao.update(hqCompany);
	}
	
	@Override
	public void delete(Integer id){
		hqCompanyDao.delete(id);
	}
	
	@Override
	public void deleteBatch(Integer[] ids){
		hqCompanyDao.deleteBatch(ids);
	}
	
}
