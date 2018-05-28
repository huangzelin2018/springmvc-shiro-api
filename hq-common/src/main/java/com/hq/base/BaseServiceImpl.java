package com.hq.base;

import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

public abstract class BaseServiceImpl<T> implements BaseService<T> {
    @Autowired
    private BaseDao<T> baseDao;

    @Override
    public void save(T t) {
        baseDao.save(t);
    }

    @Override
    public void save(Map<String, Object> map) {
        baseDao.save(map);
    }

    @Override
    public void saveBatch(List<T> list) {
        baseDao.saveBatch(list);
    }

    @Override
    public int update(T t) {
        return baseDao.update(t);
    }

    @Override
    public int update(Map<String, Object> map) {
        return baseDao.update(map);
    }

    @Override
    public int delete(Object id) {
        return baseDao.delete(id);
    }

    @Override
    public int delete(Map<String, Object> map) {
        return baseDao.delete(map);
    }

    @Override
    public int deleteBatch(Object[] id) {
        return baseDao.deleteBatch(id);
    }

    @Override
    public T queryObject(Object id) {
        return baseDao.queryObject(id);
    }

    @Override
    public List<T> queryList(Map<String, Object> map) {
        return baseDao.queryList(map);
    }

    @Override
    public List<T> queryList(Object id) {
        return baseDao.queryList(id);
    }

    @Override
    public int queryTotal(Map<String, Object> map) {
        return baseDao.queryTotal(map);
    }

    @Override
    public int queryTotal() {
        return baseDao.queryTotal();
    }
}
