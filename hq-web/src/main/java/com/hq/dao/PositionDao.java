package com.hq.dao;

import com.hq.base.BaseDao;
import com.hq.entity.PositionEntity;

import java.util.List;

/**
 * 诚聘英才-岗位信息表
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2018-05-19 15:21:59
 */
public interface PositionDao extends BaseDao<PositionEntity> {
    /**
     * 跟进分类编号查询职位列表
     * @param job_type_name
     * @return
     */
    List<PositionEntity> queryListType(String job_type_name);

    /**
     * 查询上架的职位信息
     * @param id
     * @return
     */
    PositionEntity  queryObjectByIsUse(Long id);

    List<PositionEntity> findListApi(List<Long> job_ids);
}
