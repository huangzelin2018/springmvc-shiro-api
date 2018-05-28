package com.hq.service;

import com.hq.base.BaseServiceImpl;
import com.hq.dao.PositionDao;
import com.hq.entity.PositionEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service("positionService")
public class PositionService extends BaseServiceImpl<PositionEntity> {

    @Autowired
    private PositionDao positionDao;

    public PositionEntity queryObjectByIsUse(Long id) {
        return positionDao.queryObjectByIsUse(id);
    }

    public List<PositionEntity> findListApi(List<Long> job_ids) {
        return positionDao.findListApi(job_ids);
    }

    public List<PositionEntity> queryListType(String job_type_name) {
        return positionDao.queryListType(job_type_name);
    }


}
