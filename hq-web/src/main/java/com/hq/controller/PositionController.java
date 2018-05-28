package com.hq.controller;

import com.hq.entity.PositionEntity;
import com.hq.service.PositionService;
import com.hq.utils.PageUtils;
import com.hq.utils.Query;
import com.hq.utils.R;
import com.hq.utils.ShiroUtils;
import com.hq.validator.Assert;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;


/**
 * 诚聘英才-岗位信息表
 *
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2018-05-19 15:21:59
 */
@RestController
@RequestMapping("/web/position")
public class PositionController {
    @Autowired
    private PositionService positionService;

    /**
     * 列表
     */
    @RequestMapping("/list")
    @RequiresPermissions("position:list")
    public R list(@RequestParam Map<String, Object> params) {
        //查询列表数据
        Query query = new Query(params);

        List<PositionEntity> positionList = positionService.queryList(query);
        int total = positionService.queryTotal(query);

        PageUtils pageUtil = new PageUtils(positionList, total, query.getLimit(), query.getPage());

        return R.ok().put("page", pageUtil);
    }


    /**
     * 信息
     */
    @RequestMapping("/info/{id}")
    @RequiresPermissions("position:info")
    public R info(@PathVariable("id") Long id) {
        PositionEntity position = positionService.queryObject(id);
        return R.ok().put("position", position);
    }

    /**
     * 保存
     */
    @RequestMapping("/save")
    @RequiresPermissions("position:save")
    public R save(@RequestBody PositionEntity position) {
        checkPosition(position);
        position.setCreateUserId(ShiroUtils.getUserEntity().getUserId());
        position.setCreateTime(new Date());
        position.setUpdateTime(new Date());
        position.setUpdateUserId(ShiroUtils.getUserEntity().getUserId());
        position.setIsDelete(0);
        positionService.save(position);

        return R.ok();
    }

    /**
     * 修改
     */
    @RequestMapping("/update")
    @RequiresPermissions("position:update")
    public R update(@RequestBody PositionEntity position) {
        checkPosition(position);
        position.setUpdateUserId(ShiroUtils.getUserEntity().getUserId());
        position.setUpdateTime(new Date());
        positionService.update(position);

        return R.ok();
    }

    /**
     * 检查提交的岗位信息
     *
     * @param position
     */
    private void checkPosition(PositionEntity position) {
        Assert.isBlank(position.getJobTitle(), "岗位名称不能为空");
    }

    /**
     * 删除
     */
    @RequestMapping("/delete")
    @RequiresPermissions("position:delete")
    public R delete(@RequestBody Long[] ids) {
        positionService.deleteBatch(ids);

        return R.ok();
    }


}
