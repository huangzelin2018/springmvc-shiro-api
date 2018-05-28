package com.hq.dao;

import java.util.List;

import com.hq.base.BaseDao;
import com.hq.entity.SysDictEntity;

/**
 * 
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2017-07-26 16:03:29
 */
public interface SysDictDao extends BaseDao<SysDictEntity> {
	
	List<SysDictEntity> queryTree();
	
}
