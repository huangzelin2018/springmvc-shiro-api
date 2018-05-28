package com.hq.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hq.base.BaseServiceImpl;

import com.hq.dao.PositionTypeDao;
import com.hq.entity.PositionTypeEntity;

/**
 * 职位类别管理
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2018-05-29 00:25:34
 */
@Service("positionTypeService")
public class PositionTypeService extends BaseServiceImpl<PositionTypeEntity>{

    @Autowired
    private PositionTypeDao positionTypeDao;

}
