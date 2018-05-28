package com.hq.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

import com.hq.dao.SysDictionaryDao;
import com.hq.entity.SysDictionaryEntity;
import com.hq.service.SysDictionaryService;



@Service("sysDictionaryService")
public class SysDictionaryServiceImpl implements SysDictionaryService {
	@Autowired
	private SysDictionaryDao sysDictionaryDao;
	
	@Override
	public SysDictionaryEntity queryObject(Long id){
		return sysDictionaryDao.queryObject(id);
	}
	
	@Override
	public List<SysDictionaryEntity> queryList(Map<String, Object> map){
		return sysDictionaryDao.queryList(map);
	}
	
	@Override
	public int queryTotal(Map<String, Object> map){
		return sysDictionaryDao.queryTotal(map);
	}
	
	@Override
	public void save(SysDictionaryEntity sysDictionary){
		sysDictionaryDao.save(sysDictionary);
	}
	
	@Override
	public void update(SysDictionaryEntity sysDictionary){
		sysDictionaryDao.update(sysDictionary);
	}
	
	@Override
	public void delete(Long id){
		sysDictionaryDao.delete(id);
	}
	
	@Override
	public void deleteBatch(Long[] ids){
		sysDictionaryDao.deleteBatch(ids);
	}
	
}
