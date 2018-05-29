package com.hq.controller;

import java.util.List;
import java.util.Map;

import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hq.entity.PositionTypeEntity;
import com.hq.service.PositionTypeService;
import com.hq.utils.PageUtils;
import com.hq.utils.Query;
import com.hq.utils.R;
import com.hq.controller.AbstractController;
import com.hq.validator.ValidatorUtils;
import com.hq.validator.group.AddGroup;
import com.hq.validator.group.UpdateGroup;

/**
 * 职位类别管理
 *
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2018-05-29 22:56:46
 */
@RestController
@RequestMapping("/web/positiontype")
public class PositionTypeController extends AbstractController{
    @Autowired
    private PositionTypeService positionTypeService;

    /**
     * 列表
     */
    @RequestMapping("/list")
    @RequiresPermissions("positiontype:list")
    public R list(@RequestParam Map<String, Object> params){
        //查询列表数据
        Query query = new Query(params);

        List<PositionTypeEntity> positionTypeList = positionTypeService.queryList(query);
        int total = positionTypeService.queryTotal(query);

        PageUtils pageUtil = new PageUtils(positionTypeList, total, query.getLimit(), query.getPage());

        return R.ok().put("page", pageUtil);
    }


    /**
     * 信息
     */
    @RequestMapping("/info/{id}")
    @RequiresPermissions("positiontype:info")
    public R info(@PathVariable("id") Long id){
        PositionTypeEntity positionType = positionTypeService.queryObject(id);

        return R.ok().put("positionType", positionType);
    }

    /**
     * 保存
     */
    @RequestMapping("/save")
    @RequiresPermissions("positiontype:save")
    public R save(@RequestBody PositionTypeEntity positionType){
        ValidatorUtils.validateEntity(positionType, AddGroup.class);
        positionTypeService.save(positionType);

        return R.ok();
    }

    /**
     * 修改
     */
    @RequestMapping("/update")
    @RequiresPermissions("positiontype:update")
    public R update(@RequestBody PositionTypeEntity positionType){
        ValidatorUtils.validateEntity(positionType, UpdateGroup.class);
        positionTypeService.update(positionType);

        return R.ok();
    }

    /**
     * 删除
     */
    @RequestMapping("/delete")
    @RequiresPermissions("positiontype:delete")
    public R delete(@RequestBody Long[] ids){
        positionTypeService.deleteBatch(ids);

        return R.ok();
    }

    /**
     * 上架/下架
     */
    @RequestMapping("/ishide")
    @RequiresPermissions("positiontype:ishide")
    public R ishide(@RequestBody Long[] ids){
        positionTypeService.isHide(ids);

        return R.ok();
    }
}
